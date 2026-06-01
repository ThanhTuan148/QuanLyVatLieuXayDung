const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { GOOGLE_IMG_SCRAP } = require('google-img-scrap');

const TARGET_DIR = path.join(__dirname, 'images');

// Danh muc can thu thap anh de huan luyen AI (Day du 17 san pham tu SP001 den SP020)
const CATEGORIES = [
    { name: "SP001_Xi_mang_Insee_Da_Dung", query: "xi măng insee đa dụng pcb40 bao 50kg" },
    { name: "SP002_Xi_mang_Ha_Tien_PCB40", query: "xi măng hà tiên pcb40 bao 50kg" },
    { name: "SP003_Thep_Hoa_Phat_D10", query: "thép cây hòa phát d10 xây dựng" },
    { name: "SP004_Thep_Viet_Nhat_D12", query: "thép cây việt nhật d12 xây dựng" },
    { name: "SP005_Gach_Tuynel_Binh_Duong", query: "gạch tuynel bình dương gạch ống 4 lỗ 2 lỗ" },
    { name: "SP006_Gach_Men_Prime_60x60", query: "gạch men prime 60x60 bóng kiếng lát nền" },
    { name: "SP007_Cat_xay_to", query: "cát xây tô hạt mịn đống cát sạch" },
    { name: "SP008_Da_1x2", query: "đá 1x2 xây dựng đá xanh đổ bê tông" },
    { name: "SP009_Son_Dulux_Inspire_Noi_that", query: "sơn nội thất dulux inspire thùng 18l" },
    { name: "SP010_Son_chong_tham_KOVA_CT11A", query: "sơn chống thấm kova ct11a thùng 20kg" },
    { name: "SP011_Day_dien_CV_1_5_CADIVI", query: "dây điện cadivi cv 1.5 cuộn dây đơn màu đỏ vàng" },
    { name: "SP012_Cong_tac_Panasonic_Wide", query: "công tắc panasonic wide dòng hạt lớn" },
    { name: "SP013_Bong_den_LED_Rang_Dong_9W", query: "bóng đèn led rạng đông 9w búp trụ nhôm nhựa" },
    { name: "SP014_Ong_PVC_Binh_Minh_D21", query: "ống nhựa pvc bình minh d21 cây 4m" },
    { name: "SP015_Ong_PVC_Binh_Minh_D90", query: "ống nhựa pvc bình minh d90 thoát nước" },
    { name: "SP016_May_khoan_Bosch_GSB_550", query: "máy khoan động lực bosch gsb 550 chính hãng" },
    { name: "SP020_Xi_mang_Ha_Tien_PCB40_Extra", query: "xi măng hà tiên pcb40 bao giấy vỏ xanh" }
];

const IMAGES_PER_CATEGORY = 30;

// Ham cao anh tu Bing
async function scrapeBingImages(query, limit) {
    console.log(`[Bing Scraper] Tim kiem: "${query}"...`);
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2`;
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const images = [];

    $('.iusc').each((i, el) => {
        if (images.length >= limit) return false;
        const m = $(el).attr('m');
        if (m) {
            try {
                const data = JSON.parse(m);
                if (data.murl && (data.murl.startsWith('http://') || data.murl.startsWith('https://'))) {
                    images.push(data.murl);
                }
            } catch(e){}
        }
    });
    return images;
}

// Ham cao anh tu Google
async function scrapeGoogleImages(query, limit) {
    console.log(`[Google Scraper] Tim kiem: "${query}"...`);
    try {
        const res = await GOOGLE_IMG_SCRAP({ search: query, limit: limit });
        if (res && res.result) {
            return res.result.map(item => item.url).filter(url => url.startsWith('http'));
        }
    } catch (err) {
        console.log(`[Google Scraper] Loi: ${err.message}. Chuyen sang Bing...`);
    }
    return [];
}

// Ham tai va luu 1 anh
async function downloadSingleImage(url, filepath) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filepath);
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (err) {
        throw new Error(`Loi tai ${url.substring(0, 30)}... (${err.message})`);
    }
}

async function runDownloader() {
    console.log("===============================================================");
    console.log("🚀 BAT DAU THU THAP DU LIEU HINH ANH HUAN LUYEN AI (DATASET)");
    console.log(`Thu muc luu tru: ${TARGET_DIR}`);
    console.log(`So luong: ${CATEGORIES.length} danh muc, ${IMAGES_PER_CATEGORY} anh/danh muc.`);
    console.log("===============================================================\n");

    if (!fs.existsSync(TARGET_DIR)) {
        fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    for (const cat of CATEGORIES) {
        const catDir = path.join(TARGET_DIR, cat.name.replace(/\s+/g, '_'));
        if (!fs.existsSync(catDir)) {
            fs.mkdirSync(catDir, { recursive: true });
        }

        console.log(`\n---> [Danh muc]: ${cat.name}`);
        
        // Thu lay tu Google truoc, neu it hoac loi thi lay tu Bing
        let imageUrls = await scrapeGoogleImages(cat.query, IMAGES_PER_CATEGORY + 10);
        if (imageUrls.length < IMAGES_PER_CATEGORY) {
            console.log(`[Info] Google tra ve it anh (${imageUrls.length}), bo sung tu Bing...`);
            const bingUrls = await scrapeBingImages(cat.query, IMAGES_PER_CATEGORY);
            imageUrls = [...imageUrls, ...bingUrls];
        }

        // Loai bo url trung lap
        imageUrls = [...new Set(imageUrls)];
        console.log(`[Info] Tong so URL tim thay cho "${cat.name}": ${imageUrls.length}`);

        let downloadedCount = 0;
        for (let i = 0; i < imageUrls.length; i++) {
            if (downloadedCount >= IMAGES_PER_CATEGORY) break;
            const url = imageUrls[i];
            // Tao ten file duy nhat
            const ext = path.extname(new URL(url).pathname) || '.jpg';
            const cleanExt = ext.split('?')[0].toLowerCase();
            const validExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(cleanExt) ? cleanExt : '.jpg';
            const filename = `img_${downloadedCount + 1}${validExt}`;
            const filepath = path.join(catDir, filename);

            try {
                await downloadSingleImage(url, filepath);
                downloadedCount++;
                process.stdout.write(`✔ ${downloadedCount} `);
            } catch (e) {
                process.stdout.write(`❌ `);
            }
        }
        console.log(`\n Hoan thanh tai ${downloadedCount}/${IMAGES_PER_CATEGORY} anh cho danh muc [${cat.name}].`);
    }

    console.log("\n===============================================================");
    console.log("🎉 DA THU THAP XONG TOAN BO DU LIEU DATASET!");
    console.log(`Kiem tra cac thu muc con tai: ${TARGET_DIR}`);
    console.log("===============================================================");
}

runDownloader().catch(err => console.error("Loi he thong:", err));
