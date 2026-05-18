Dưới đây là tài liệu thuyết minh chi tiết và chuẩn hóa mang tính học thuật về Chức năng Tìm kiếm Vật liệu xây dựng bằng Hình ảnh (AI Visual Search).

Bạn có thể sử dụng nội dung này trực tiếp vào Báo cáo Khóa luận Tốt nghiệp (KLTN) hoặc dùng làm lời thuyết trình khi Bảo vệ trước Hội đồng.

📑 THUYẾT MINH CHI TIẾT: HỆ THỐNG AI VISUAL SEARCH
1. Tổng quan về Kiến trúc và Công nghệ (Overview & Technology Stack)
Tên chức năng: Tìm kiếm sản phẩm vật liệu xây dựng bằng hình ảnh (AI Visual Search).
Vị trí xử lý: Client-side AI / Edge AI (Xử lý suy luận 100% trực tiếp trên trình duyệt của người dùng).
Công nghệ & Thư viện cốt lõi:
TensorFlow.js (Engine thực thi mô hình học sâu trên nền web).
@teachablemachine/image (Thư viện gói gọn các thao tác tải mô hình và xử lý ảnh đầu vào).
Mô hình Học sâu (Deep Learning Model): Sử dụng kiến trúc mạng nơ-ron tích chập (CNN) MobileNetV2 kết hợp cơ chế Transfer Learning (Học chuyển tiếp) thông qua nền tảng Google Teachable Machine.
💡 Lý do lựa chọn kiến trúc MobileNetV2 & Client-side:
Tối ưu hóa hiệu năng (Lightweight & Fast): MobileNetV2 áp dụng kỹ thuật Depthwise Separable Convolution (Tích chập tách biệt chiều sâu), giúp giảm thiểu tối đa số lượng tham số và phép tính so với các mạng CNN truyền thống (như VGG hay ResNet). Điều này giúp mô hình chạy mượt mà ngay cả trên điện thoại di động hoặc máy tính có cấu hình yếu.
Bảo mật & Tiết kiệm chi phí Server (Zero Server-cost & Privacy): Toàn bộ quá trình phân tích ảnh (Inference) diễn ra trên bộ nhớ RAM trình duyệt của khách hàng. Hệ thống không cần gửi ảnh lên server Backend, giúp phản hồi gần như tức thì (Real-time) và doanh nghiệp không phải tốn chi phí thuê duy trì máy chủ GPU đắt đỏ.
2. Quy trình Xây dựng và Huấn luyện Dữ liệu (Dataset & Training Pipeline)
Để AI nhận diện chính xác các loại vật liệu đặc thù (gạch men, xi măng, sơn tường, cát, đá...), quy trình huấn luyện được thực hiện qua 4 bước chuẩn hóa:

[Thu thập Dữ liệu tự động] ➔ [Tiền xử lý & Gắn nhãn] ➔ [Transfer Learning (MobileNetV2)] ➔ [Xuất Model tĩnh (JSON/BIN)]
Bước 1: Thu thập bộ dữ liệu (Data Collection)
Hệ thống được trang bị một công cụ tự động thu thập hình ảnh (Database/download_dataset.js).
Dữ liệu được thu thập cho toàn bộ danh mục sản phẩm trong hệ thống (từ mã SP001 đến SP020 bao gồm: Xi măng Hà Tiên, Gạch men Prime, Gạch Tuynel, Sơn Dulux/Kova, Thép Hòa Phát, Đá 1x2, Cát xây tô...).
Mỗi nhãn sản phẩm (Class) thu thập tối thiểu 30 - 50 hình ảnh thực tế ở các góc chụp, độ sáng và bối cảnh công trình khác nhau để đảm bảo mô hình không bị học vẹt (Overfitting).
Bước 2: Tiền xử lý & Cấu trúc nhãn (Labeling)
Các hình ảnh được chia thành các thư mục tương ứng với mã sản phẩm trong cơ sở dữ liệu (ví dụ: SP001_XiMang, SP005_GachTuynel, SP009_SonDulux). Việc đặt tên nhãn chứa mã sản phẩm giúp Frontend dễ dàng bóc tách và đối chiếu tự động.
Bước 3: Huấn luyện mô hình bằng Transfer Learning
Thay vì huấn luyện một mạng CNN từ con số 0 (rất tốn thời gian và cần hàng triệu ảnh), hệ thống sử dụng phương pháp Transfer Learning.
Mô hình gốc MobileNetV2 (đã được Google huấn luyện trước trên tập dữ liệu khổng lồ ImageNet với 1.4 triệu ảnh) được giữ nguyên các tầng trích xuất đặc trưng (Feature Extraction Layers).
Hệ thống đóng băng (Freeze) các tầng đầu và chỉ huấn luyện lại (Fine-tune) tầng phân loại cuối cùng (Fully Connected / Softmax Layer) để học nhận diện các đặc trưng bề mặt riêng biệt của 20+ lớp vật liệu xây dựng.
Siêu tham số huấn luyện (Hyperparameters):
Epochs (Số vòng lặp): 50
Batch Size (Cỡ lô): 16
Learning Rate (Tốc độ học): 0.001
Bước 4: Xuất và triển khai mô hình (Model Export)
Mô hình sau khi huấn luyện được xuất dưới dạng gói TensorFlow.js tĩnh bao gồm 3 file:
model.json: Chứa thông tin về cấu trúc đồ thị mạng (Graph Topology).
weights.bin: Chứa các ma trận trọng số (Weights) của các nơ-ron sau quá trình học.
metadata.json: Chứa danh sách tên các nhãn sản phẩm (Classes).
Bộ 3 file này được lưu trữ trực tiếp trong thư mục tĩnh của Frontend (Frontend/public/models/).
3. Quy trình Hoạt động Thực tế trên Ứng dụng (Execution Workflow)
Khi khách hàng sử dụng chức năng trên giao diện (VisualSearchModal.js), luồng thực thi diễn ra theo các bước sau:

Khởi tạo & Tải ảnh (Input): Khách hàng chọn/chụp một bức ảnh mẫu gạch hoặc sơn. Ảnh được chuyển thành đối tượng DOM Image và hiển thị hiệu ứng quét laser trực quan trên UI.
Tải mô hình vào bộ nhớ (Load Model): Hàm tmImage.load(modelURL, metadataURL) đọc các file mô hình tĩnh từ thư mục /models/ và nạp vào bộ nhớ trình duyệt.
Suy luận AI (Prediction): Hàm model.predict(imageHtmlElement) đưa ảnh đầu vào đi qua mạng nơ-ron MobileNetV2. Kết quả trả về là một mảng danh sách các nhãn kèm theo tỷ lệ xác suất (Probability từ 0.0 đến 1.0).
Bóc tách & Đối chiếu (Matching & Ranking):
Hệ thống tìm ra nhãn có xác suất cao nhất (Top 1 Best Match).
Dựa vào tên nhãn (ví dụ SP005_GachTuynel), thuật toán sẽ quét trong danh sách sản phẩm của cơ sở dữ liệu (allProducts) để tìm ra sản phẩm tương ứng.
Sản phẩm Top 1 sẽ được đẩy lên đầu danh sách và hiển thị rõ ràng phần trăm tương thích (✨ 99% khớp). Các sản phẩm có đặc tính gần giống khác được xếp ngay phía dưới để gợi ý thêm cho người mua.
Chuyển đổi (Call-to-Action): Khách hàng dễ dàng bấm nút "Thêm vào giỏ hàng" để mua ngay sản phẩm vừa quét được.
4. Gợi ý Trả lời Câu hỏi phản biện của Hội đồng (Q&A cho KLTN)
Dưới đây là các câu hỏi mà Hội đồng chấm đồ án rất hay hỏi và cách trả lời ghi điểm tuyệt đối:

❓ Câu 1: Tại sao em lại chọn chạy AI ở Frontend (TensorFlow.js) mà không chạy trên Backend (Python/PyTorch/Flask)?
Trả lời: "Thưa Hội đồng, việc em chọn chạy mô hình trực tiếp ở Client-side (Frontend) là một quyết định kiến trúc có chủ đích nhằm giải quyết 3 vấn đề thực tế của doanh nghiệp:

Tối ưu chi phí vận hành: Nếu chạy ở Backend, doanh nghiệp sẽ phải thuê máy chủ có GPU chuyên dụng (rất đắt đỏ) để xử lý ảnh. Khi chạy ở Client, hệ thống tận dụng trực tiếp tài nguyên RAM/CPU/GPU của thiết bị người dùng, giúp doanh nghiệp vận hành tính năng AI với chi phí máy chủ bằng 0.
Tốc độ phản hồi (Zero Latency): Không cần mất thời gian truyền tải file ảnh lớn qua đường truyền mạng lên server và chờ phản hồi, quá trình nhận diện diễn ra tức thì trên trình duyệt.
Bảo mật dữ liệu: Hình ảnh chụp tại công trình hay nhà riêng của khách hàng không bị lưu trữ trái phép lên server."
❓ Câu 2: Nếu sau này cửa hàng nhập thêm 100 sản phẩm mới, em sẽ cập nhật hệ thống AI như thế nào? Có cần đụng chạm vào code Frontend hay Backend không?
Trả lời: "Thưa Hội đồng, kiến trúc của em đã tách biệt hoàn toàn giữa phần Code Logic và phần Dữ liệu Mô hình (Model Data). Khi có thêm 100 sản phẩm mới, quản trị viên chỉ cần:

Chạy script thu thập ảnh tự động cho 100 mã sản phẩm mới.
Đưa vào Google Teachable Machine để Retrain (huấn luyện lại) trong vòng vài phút.
Tải bộ 3 file model.json, weights.bin, metadata.json mới và ghi đè vào thư mục public/models/. Hệ thống Frontend sẽ tự động nhận diện các sản phẩm mới ngay lập tức mà hoàn toàn không cần sửa đổi bất kỳ một dòng code nào ở cả Frontend lẫn Backend."
❓ Câu 3: Mô hình MobileNetV2 có nhược điểm gì không và giải pháp khắc phục của em là gì?
Trả lời: "Thưa Hội đồng, nhược điểm của MobileNetV2 là do tối ưu hóa để có dung lượng nhẹ, độ chính xác của nó có thể bị giảm khi ảnh chụp trong điều kiện ánh sáng quá tối hoặc bị nhòe. Để khắc phục điều này trong thực tế, trên giao diện Frontend em đã bố trí hệ thống tự động lọc kết quả và hiển thị kèm các sản phẩm gợi ý liên quan (Layer 2), đồng thời cho phép người dùng dễ dàng bấm nút chụp/chọn lại ảnh khác để có góc nhìn rõ nét hơn."