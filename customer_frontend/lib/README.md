# مكتبات JavaScript المحلية

هذا المجلد يحتوي على مكتبات JavaScript المستخدمة في Customer Frontend بدلاً من الاعتماد على CDN.

## المكتبات المطلوبة:

1. **Font Awesome 6.4.0**
   - URL: https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css
   - احفظ في: `css/fontawesome.css`

2. **AOS 2.3.1**
   - CSS: https://unpkg.com/aos@2.3.1/dist/aos.css
   - JS: https://unpkg.com/aos@2.3.1/dist/aos.js
   - احفظ في: `css/aos.css` و `js/aos.js`

3. **GSAP 3.12.5**
   - JS: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
   - ScrollTrigger: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js
   - احفظ في: `js/gsap.min.js` و `js/ScrollTrigger.min.js`

4. **Lottie Web 5.12.2**
   - JS: https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js
   - احفظ في: `js/lottie.min.js`

5. **Three.js r128**
   - JS: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
   - احفظ في: `js/three.min.js`

6. **Socket.io 4.7.2**
   - JS: https://cdn.socket.io/4.7.2/socket.io.min.js
   - احفظ في: `js/socket.io.min.js`

## طريقة التحميل:

يمكنك تحميل هذه الملفات يدوياً من الروابط أعلاه، أو استخدام الأمر التالي:

```bash
# إنشاء المجلدات
mkdir -p css js

# تحميل المكتبات
curl -o css/fontawesome.css https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css
curl -o css/aos.css https://unpkg.com/aos@2.3.1/dist/aos.css
curl -o js/aos.js https://unpkg.com/aos@2.3.1/dist/aos.js
curl -o js/gsap.min.js https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
curl -o js/ScrollTrigger.min.js https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js
curl -o js/lottie.min.js https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js
curl -o js/three.min.js https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
curl -o js/socket.io.min.js https://cdn.socket.io/4.7.2/socket.io.min.js
```

## المزايا:

- لا يحتاج اتصال إنترنت
- تحميل أسرع
- استقرار أفضل
- عدم الاعتماد على خدمات خارجية
