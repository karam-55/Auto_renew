// Garage Go Customer Frontend - JavaScript

// Use relative URLs since customer_frontend is served by backend
const API_BASE_URL = '/api';
const SOCKET_URL = window.location.origin;

// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// DOM Elements
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorMessage = document.getElementById('error-message');
const bookingDetails = document.getElementById('booking-details');
const lastUpdated = document.getElementById('last-updated');

// Socket.io client
let socket = null;

// Status badge colors
const statusColors = {
    'PENDING': 'pending',
    'CONFIRMED': 'confirmed',
    'IN_PROGRESS': 'in-progress',
    'WAITING_PARTS': 'waiting-parts',
    'READY': 'ready',
    'COMPLETED': 'completed',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled'
};

const statusTexts = {
    'PENDING': 'قيد الانتظار',
    'CONFIRMED': 'مؤكد',
    'IN_PROGRESS': 'قيد العمل',
    'WAITING_PARTS': 'بانتظار القطع',
    'READY': 'جاهز',
    'COMPLETED': 'مكتمل',
    'DELIVERED': 'تم التسليم',
    'CANCELLED': 'ملغي'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Three.js Background
    initThreeBackground();
    
    // Initialize AOS
    AOS.init({
        duration: 800,
        once: true,
        offset: 50
    });

    // Initialize Lottie loading
    initLottieLoading();

    if (!token) {
        showError('رمز الحجز غير موجود');
        return;
    }

    loadBookingDetails();
    initSocket();
    initRatingStars();
});

// Initialize Three.js Particle Background
function initThreeBackground() {
    if (typeof THREE === 'undefined') return;
    
    const canvas = document.createElement('canvas');
    canvas.id = 'three-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 150;
    const posArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 10;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    // Gold material for particles
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.05,
        color: 0xD4AF37,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    camera.position.z = 3;
    
    // Animation
    function animate() {
        requestAnimationFrame(animate);
        
        particlesMesh.rotation.x += 0.0005;
        particlesMesh.rotation.y += 0.0005;
        
        // Gentle floating
        particlesMesh.position.y = Math.sin(Date.now() * 0.0005) * 0.1;
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    // Handle resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Initialize Lottie loading animation
function initLottieLoading() {
    const lottieContainer = document.getElementById('lottie-loading');
    if (lottieContainer && typeof lottie !== 'undefined') {
        lottie.loadAnimation({
            container: lottieContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'https://lottie.host/9d5ed8c8-6f6b-4a6a-8c8b-2b7e8c8e8e8e/loading.json'
        });
    }
}

// Initialize Socket.io
function initSocket() {
    try {
        socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('Connected to server');
            // Join booking room
            socket.emit('join-booking', { token });
        });

        socket.on('booking-updated', (data) => {
            console.log('Booking updated:', data);
            if (data.publicToken === token) {
                // Add status change animation
                const statusBadge = document.getElementById('status-badge');
                statusBadge.classList.add('status-change');
                setTimeout(() => {
                    statusBadge.classList.remove('status-change');
                }, 1000);
                
                loadBookingDetails();
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        socket.on('connect_error', (error) => {
            console.log('Socket connection error:', error);
        });
    } catch (err) {
        console.log('Socket.io not available, falling back to polling');
    }
}

// Load booking details
async function loadBookingDetails() {
    try {
        console.log('Loading booking details with token:', token);
        const response = await fetch(`${API_BASE_URL}/public/booking/${token}`);

        console.log('Response status:', response.status);

        if (response.status === 404) {
            throw new Error('رمز الحجز غير صالح');
        }

        if (!response.ok) {
            throw new Error('فشل تحميل البيانات');
        }

        const data = await response.json();
        console.log('Booking data received:', data);
        displayBookingDetails(data.booking);
    } catch (err) {
        console.error('Error loading booking details:', err);
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
            showError('خطأ في الاتصال بالخادم');
        } else {
            showError(err.message);
        }
    }
}

// Display booking details
function displayBookingDetails(booking) {
    console.log('Displaying booking details:', booking);

    // Query elements fresh (don't rely on global variables)
    const loadingEl = document.getElementById('loading');
    const bookingDetailsEl = document.getElementById('booking-details');
    const lastUpdatedEl = document.getElementById('last-updated');

    console.log('loading element:', loadingEl);
    console.log('bookingDetails element:', bookingDetailsEl);

    if (!bookingDetailsEl) {
        console.error('ERROR: booking-details element not found in DOM!');
        return;
    }

    // Hide loading, show details
    if (loadingEl) loadingEl.classList.add('hidden');
    bookingDetailsEl.classList.remove('hidden');
    bookingDetailsEl.style.display = 'block';
    console.log('Classes updated - loading hidden, details shown');

    // Update last updated timestamp
    if (lastUpdatedEl) lastUpdatedEl.textContent = new Date().toLocaleTimeString('ar-SY');

    // Cards are naturally visible, no animation needed

    // Status badge
    const statusBadge = document.getElementById('status-badge');
    const statusText = document.getElementById('status-text');
    statusBadge.className = `status-badge ${statusColors[booking.status] || 'pending'}`;
    statusText.textContent = statusTexts[booking.status] || booking.status;

    // Company info
    document.getElementById('company-name').textContent = booking.tenant?.companyNameAr || booking.tenant?.companyName || 'Garage Go';
    document.getElementById('company-phone').textContent = booking.tenant?.phone || '-';

    // Customer info (phone only - NO EMAIL)
    document.getElementById('customer-name').textContent = booking.customer?.fullName || '-';
    document.getElementById('customer-phone').textContent = booking.customer?.phone || '-';

    // Vehicle info
    document.getElementById('vehicle-make').textContent = booking.vehicle?.make || '-';
    document.getElementById('vehicle-model').textContent = booking.vehicle?.model || '-';
    document.getElementById('vehicle-year').textContent = booking.vehicle?.year || '-';
    document.getElementById('vehicle-plate').textContent = booking.vehicle?.licensePlate || booking.vehicle?.plateNumber || '-';

    // Booking info
    document.getElementById('booking-id').textContent = booking.id ? booking.id.substring(0, 8) : '-';
    document.getElementById('booking-date').textContent = formatDate(booking.createdAt);
    document.getElementById('estimated-date').textContent = booking.estimatedCompletionDate
        ? formatDate(booking.estimatedCompletionDate)
        : '-';
    document.getElementById('booking-notes').textContent = booking.notes || '-';

    // Services - No prices shown for customer
    const servicesList = document.getElementById('services-list');
    if (booking.bookingServices && booking.bookingServices.length > 0) {
        servicesList.innerHTML = booking.bookingServices.map((service, index) => `
            <div class="service-item">
                <span class="service-number">${index + 1}.</span>
                <span class="service-name">${service.service?.name || service.description || service.name || '-'}</span>
            </div>
        `).join('');
    } else if (booking.services && booking.services.length > 0) {
        servicesList.innerHTML = booking.services.map((service, index) => `
            <div class="service-item">
                <span class="service-number">${index + 1}.</span>
                <span class="service-name">${service.name || service.description || '-'}</span>
            </div>
        `).join('');
    } else {
        servicesList.innerHTML = '<p>لا توجد خدمات</p>';
    }

    // Invoice
    if (booking.invoice) {
        const invoice = booking.invoice;
        document.getElementById('subtotal').textContent = formatCurrency(invoice.subtotalSYP || invoice.subtotal, invoice.subtotalUSD);
        document.getElementById('tax').textContent = formatCurrency(invoice.taxSYP || invoice.tax, invoice.taxUSD);
        document.getElementById('discount').textContent = formatCurrency(invoice.discountSYP || invoice.discount, invoice.discountUSD);
        document.getElementById('total').textContent = formatCurrency(invoice.totalSYP || invoice.total, invoice.totalUSD);
        document.getElementById('paid').textContent = formatCurrency(invoice.paidSYP || invoice.paid, invoice.paidUSD);

        const totalSYP = invoice.totalSYP || invoice.total || 0;
        const paidSYP = invoice.paidSYP || invoice.paid || 0;
        const remainingSYP = totalSYP - paidSYP;
        
        const totalUSD = invoice.totalUSD || 0;
        const paidUSD = invoice.paidUSD || 0;
        const remainingUSD = totalUSD > 0 ? totalUSD - paidUSD : null;
        
        document.getElementById('remaining').textContent = formatCurrency(remainingSYP, remainingUSD);
    } else {
        document.getElementById('subtotal').textContent = '0 SYP';
        document.getElementById('tax').textContent = '0 SYP';
        document.getElementById('discount').textContent = '0 SYP';
        document.getElementById('total').textContent = '0 SYP';
        document.getElementById('paid').textContent = '0 SYP';
        document.getElementById('remaining').textContent = '0 SYP';
    }

    // Mechanic notes
    const mechanicNotes = document.getElementById('mechanic-notes');
    if (booking.mechanicAssignments && booking.mechanicAssignments.length > 0) {
        const assignment = booking.mechanicAssignments[0];
        mechanicNotes.innerHTML = assignment.notes
            ? `<p>${assignment.notes}</p>`
            : '<p>لا توجد ملاحظات حالياً</p>';
    } else if (booking.mechanicNotes) {
        mechanicNotes.innerHTML = `<p>${booking.mechanicNotes}</p>`;
    } else {
        mechanicNotes.innerHTML = '<p>لا توجد ملاحظات حالياً</p>';
    }

    // Show rating section if booking is completed
    const ratingSection = document.getElementById('rating-section');
    if (booking.status === 'COMPLETED' || booking.status === 'DELIVERED') {
        ratingSection.style.display = 'block';
        ratingSection.setAttribute('data-aos', 'fade-up');
    }
}

// Show error
function showError(message) {
    loading.classList.add('hidden');
    error.classList.remove('hidden');
    errorMessage.textContent = message;
}

// Retry
function retry() {
    error.classList.add('hidden');
    loading.classList.remove('hidden');
    loadBookingDetails();
}

// Initialize rating stars
function initRatingStars() {
    const stars = document.querySelectorAll('.star');
    let currentRating = 0;

    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            currentRating = rating;
            updateStars(rating);
        });

        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            updateStars(rating);
        });

        star.addEventListener('mouseleave', () => {
            updateStars(currentRating);
        });
    });
}

function updateStars(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function submitRating() {
    const activeStars = document.querySelectorAll('.star.active');
    const rating = activeStars.length;
    const comment = document.getElementById('rating-comment').value;

    if (rating === 0) {
        alert('يرجى اختيار تقييم');
        return;
    }

    // Here you would send the rating to the backend
    console.log('Rating submitted:', { rating, comment });
    alert('شكراً لتقييمك!');
    
    // Hide rating section after submission
    document.getElementById('rating-section').style.display = 'none';
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format currency
function formatCurrency(syp, usd) {
    if (usd && usd > 0) {
        return `${formatNumber(syp)} SYP / ${formatNumber(usd)} USD`;
    }
    return `${formatNumber(syp)} SYP`;
}

// Format number
function formatNumber(num) {
    if (!num) return '0';
    return new Intl.NumberFormat('ar-SY').format(num);
}

// Auto-refresh every 30 seconds (fallback if socket.io fails)
setInterval(() => {
    if (!bookingDetails.classList.contains('hidden')) {
        loadBookingDetails();
    }
}, 30000);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (socket) {
        socket.disconnect();
    }
});
