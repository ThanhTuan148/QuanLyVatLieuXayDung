import React, { useState, useRef, useEffect } from 'react';
import * as tmImage from '@teachablemachine/image';
import {
    Dialog, DialogTitle, DialogContent, Box, Typography, Button,
    IconButton, Grid, Card, CardContent, CircularProgress, Alert,
    Divider, LinearProgress, Chip
} from '@mui/material';
import {
    Close, PhotoCameraOutlined, CloudUploadOutlined,
    ShoppingCartOutlined, StyleOutlined
} from '@mui/icons-material';
import cartService from '../services/cartService';
import { useNavigate } from 'react-router-dom';

// Cache to store the loaded Teachable Machine model to optimize performance
let tmModelCache = null;

const VisualSearchModal = ({ open, onClose, allProducts }) => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const imageRef = useRef(null);

    const [imageSrc, setImageSrc] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [matchedProducts, setMatchedProducts] = useState([]);
    const [analysisError, setAnalysisError] = useState(null);

    // Clear states when closed
    useEffect(() => {
        if (!open) {
            setImageSrc(null);
            setScanning(false);
            setScanProgress(0);
            setMatchedProducts([]);
            setAnalysisError(null);
        }
    }, [open]);

    // Handle progress animation
    useEffect(() => {
        let timer;
        if (scanning) {
            setScanProgress(0);
            timer = setInterval(() => {
                setScanProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(timer);
                        return 100;
                    }
                    return prev + 20;
                });
            }, 200);
        } else {
            setScanProgress(0);
        }
        return () => clearInterval(timer);
    }, [scanning]);

    // Run analysis when progress reaches 100%
    useEffect(() => {
        if (scanProgress === 100 && scanning) {
            performAnalysis();
        }
    }, [scanProgress, scanning]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageSrc(event.target.result);
                setScanning(true);
                setScanProgress(0);
                setAnalysisError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    // Hàm phân tích ảnh bằng Teachable Machine (TensorFlow.js)
    const runTeachableMachineAI = async (imageHtmlElement) => {
        try {
            if (!tmModelCache) {
                const URL = "/models/";
                const modelURL = URL + "model.json";
                const metadataURL = URL + "metadata.json";
                tmModelCache = await tmImage.load(modelURL, metadataURL);
            }
            const predictions = await tmModelCache.predict(imageHtmlElement);

            let bestMatch = predictions[0];
            for (let i = 1; i < predictions.length; i++) {
                if (predictions[i].probability > bestMatch.probability) {
                    bestMatch = predictions[i];
                }
            }

            console.log("AI Dự đoán thành công:", bestMatch);
            return bestMatch;
        } catch (error) {
            console.error("Lỗi chạy Teachable Machine (chưa có model dưới đĩa):", error);
            return null;
        }
    };

    // Perform Teachable Machine AI image analysis
    const performAnalysis = async () => {
        try {
            if (!imageRef.current) {
                console.error("Không tìm thấy phần tử hình ảnh để phân tích");
                setScanning(false);
                return;
            }

            setAnalysisError(null);
            const tmPrediction = await runTeachableMachineAI(imageRef.current);

            // Ngưỡng độ tin cậy tối thiểu (60%) để lọc các ảnh không liên quan
            const CONFIDENCE_THRESHOLD = 0.60;

            if (!tmPrediction) {
                setAnalysisError("Không thể chạy mô hình phân tích ảnh. Vui lòng thử lại.");
                setMatchedProducts([]);
                setScanning(false);
                return;
            }

            if (tmPrediction.probability < CONFIDENCE_THRESHOLD) {
                console.warn(`Độ tin cậy của AI quá thấp (${Math.round(tmPrediction.probability * 100)}% < 60%). Ảnh có thể không liên quan.`);
                setMatchedProducts([]);
                setScanning(false);
                return;
            }

            // Đối khớp sản phẩm bằng nhãn dự báo của Teachable Machine
            const matches = allProducts.map(p => {
                const nameLower = String(p.tenSP || p.tenSanPham || '').toLowerCase();
                const codeLower = String(p.maSP || p.maSanPham || '').toLowerCase();
                const tmClassLower = String(tmPrediction.className || '').toLowerCase();

                let isMatch = false;

                // 1. Kiểm tra chứa trực tiếp
                if (tmClassLower.includes(codeLower) || tmClassLower.includes(nameLower) || nameLower.includes(tmClassLower)) {
                    isMatch = true;
                }

                // 2. Kiểm tra mã sản phẩm
                if (!isMatch && codeLower) {
                    const firstSegment = tmClassLower.split('_')[0].toLowerCase();
                    if (codeLower.includes(firstSegment)) {
                        isMatch = true;
                    }
                }

                // 3. Đối khớp từ (Fuzzy matching)
                if (!isMatch) {
                    const tmWords = tmClassLower.split(/\s+/).filter(w => w.length > 2);
                    if (tmWords.length > 0) {
                        let wordMatchCount = 0;
                        tmWords.forEach(w => {
                            if (nameLower.includes(w)) {
                                wordMatchCount++;
                            }
                        });
                        if (wordMatchCount / tmWords.length >= 0.5) {
                            isMatch = true;
                        }
                    }
                }

                const score = isMatch ? Math.max(Math.round(tmPrediction.probability * 100), 1) : 0;

                return {
                    ...p,
                    tenSP: p.tenSP || p.tenSanPham || '',
                    maSP: p.maSP || p.maSanPham || '',
                    maSanPham: p.maSanPham || p.maSP || '',
                    matchScore: score
                };
            })
                .filter(p => p.matchScore > 0)
                .sort((a, b) => b.matchScore - a.matchScore);

            setMatchedProducts(matches);
        } catch (err) {
            console.error("Lỗi trong quá trình phân tích ảnh:", err);
            setAnalysisError("Lỗi hệ thống khi phân tích hình ảnh.");
            setMatchedProducts([]);
        } finally {
            setScanning(false);
        }
    };

    const handleAddToCart = async (prod) => {
        try {
            await cartService.addToCart({
                productId: prod.maSanPham || prod.maSP,
                productName: prod.tenSP || prod.tenSanPham,
                price: prod.giaSauKhuyenMai || prod.giaBan,
                image: prod.hinhAnh,
                unit: prod.donViTinh,
                quantity: 1
            });
            alert(`🎉 Đã thêm thành công 1 ${prod.donViTinh} "${prod.tenSP || prod.tenSanPham}" vào giỏ hàng!`);
            window.dispatchEvent(new CustomEvent('cart-updated'));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: '16px' } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: '1px solid #eaeaea' }}>
                <Typography variant="h6" component="span" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#e68c55' }}>
                    <PhotoCameraOutlined /> 🔍 Tìm Kiếm Bằng Hình Ảnh (AI Visual Search)
                </Typography>
                <IconButton onClick={onClose} size="small"><Close /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4 }}>
                {!imageSrc ? (
                    // Upload Area
                    <Box
                        onClick={() => fileInputRef.current.click()}
                        sx={{
                            border: '2px dashed #d3d3d3',
                            borderRadius: '16px',
                            py: 8,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            bgcolor: '#fafafa',
                            '&:hover': {
                                borderColor: '#e68c55',
                                bgcolor: 'rgba(230,140,85,0.02)'
                            }
                        }}
                    >
                        <CloudUploadOutlined sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                            Tải ảnh lên hoặc chụp ảnh mẫu
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Hỗ trợ tìm kiếm nhanh gạch men, màu sơn hoặc vật tư tương tự trong kho hàng
                        </Typography>
                        <Button variant="contained" sx={{ bgcolor: '#e68c55', color: 'white', px: 4, borderRadius: '8px', textTransform: 'none', '&:hover': { bgcolor: '#d47b44' } }}>
                            Chọn hình ảnh của bạn
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </Box>
                ) : (
                    // Preview & Scanning Area
                    <Grid container spacing={4}>
                        {/* Left: Picture and Scan Animation */}
                        <Grid item xs={12} md={5}>
                            <Box sx={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eaeaea', bgcolor: '#000', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img ref={imageRef} src={imageSrc} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Mẫu chụp" />

                                {/* Visual scanner overlay */}
                                {scanning && (
                                    <Box
                                        sx={{
                                            position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                                            background: 'rgba(230,140,85,0.1)',
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute', left: 0, right: 0, height: '4px',
                                                background: 'linear-gradient(to right, transparent, #e68c55, transparent)',
                                                animation: 'scanLine 1.5s infinite linear',
                                                boxShadow: '0 0 10px #e68c55'
                                            }
                                        }}
                                    />
                                )}
                            </Box>

                            {scanning && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
                                        🔍 Đang nhận diện hình ảnh... {scanProgress}%
                                    </Typography>
                                    <LinearProgress variant="determinate" value={scanProgress} sx={{ height: 6, borderRadius: 3, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { bgcolor: '#e68c55' } }} />
                                </Box>
                            )}

                            {/* Upload Another Button */}
                            {!scanning && (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => setImageSrc(null)}
                                    sx={{ mt: 2, borderRadius: '8px', textTransform: 'none', borderColor: '#e68c55', color: '#e68c55', '&:hover': { borderColor: '#d47b44', bgcolor: 'rgba(230,140,85,0.02)' } }}
                                >
                                    📸 Chọn ảnh khác
                                </Button>
                            )}
                        </Grid>

                        {/* Right: AI Analysis Results */}
                        <Grid item xs={12} md={7}>
                            {scanning ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <CircularProgress sx={{ color: '#e68c55', mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Hệ thống AI đang nhận diện sản phẩm...
                                    </Typography>
                                </Box>
                            ) : (
                                <Box>
                                    {analysisError && (
                                        <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
                                            {analysisError}
                                        </Alert>
                                    )}

                                    {/* Matches List */}
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5, color: '#333', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <StyleOutlined sx={{ fontSize: 18, color: '#e68c55' }} /> 📦 Sản phẩm tương thích tốt nhất:
                                    </Typography>

                                    {matchedProducts.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            {matchedProducts.slice(0, 1).map((prod, idx) => {
                                                const hasDiscount = prod.giaSauKhuyenMai < prod.giaBan;
                                                const price = prod.giaSauKhuyenMai || prod.giaBan;

                                                return (
                                                    <Card key={idx} variant="outlined" sx={{ borderRadius: '12px', borderColor: '#eaeaea', display: 'flex', p: 1.5, alignItems: 'center', transition: 'all 0.2s', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: '#e68c55' } }}>
                                                        {/* Product Image */}
                                                        <Box sx={{ width: 60, height: 60, mr: 2, bgcolor: '#f5f5f5', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            {prod.hinhAnh ? (
                                                                <img src={prod.hinhAnh} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="" />
                                                            ) : (
                                                                <Typography variant="caption" color="text.secondary">Vật tư</Typography>
                                                            )}
                                                        </Box>

                                                        {/* Details */}
                                                        <Box sx={{ flexGrow: 1 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                                {prod.tenSP}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                                                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#e68c55' }}>
                                                                    ₫{price.toLocaleString('vi-VN')}
                                                                </Typography>
                                                                {hasDiscount && (
                                                                    <Typography variant="caption" sx={{ textDecoration: 'line-through', opacity: 0.6 }}>
                                                                        ₫{prod.giaBan.toLocaleString('vi-VN')}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Box>

                                                        {/* Similarity Score and Cart Button */}
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, ml: 2, flexShrink: 0 }}>
                                                            <Typography variant="caption" sx={{ bgcolor: 'rgba(230,140,85,0.1)', color: '#e68c55', px: 1, py: 0.2, borderRadius: '4px', fontWeight: 'bold' }}>
                                                                ✨ {prod.matchScore}% khớp
                                                            </Typography>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                onClick={() => handleAddToCart(prod)}
                                                                sx={{ bgcolor: '#e68c55', color: 'white', fontSize: '0.75rem', textTransform: 'none', borderRadius: '6px', py: 0.5, px: 1.5, '&:hover': { bgcolor: '#d47b44' } }}
                                                            >
                                                                🛒 Thêm vào
                                                            </Button>
                                                        </Box>
                                                    </Card>
                                                );
                                            })}
                                        </Box>
                                    ) : (
                                        <Alert severity="info" sx={{ borderRadius: '12px' }}>
                                            Không tìm thấy sản phẩm nào có đặc tính tương đương.
                                        </Alert>
                                    )}
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                )}


            </DialogContent>

            {/* Dynamic Keyframe style for scanLine animation */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes scanLine {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}} />
        </Dialog>
    );
};

export default VisualSearchModal;
