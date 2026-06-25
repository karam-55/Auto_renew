// ═══════════════════════════════════════════════════
//  Garage Go - Customer Frontend
//  Premium UI with Timeline, Particles & Animations
// ═══════════════════════════════════════════════════

const API_BASE_URL = '/api';
const SOCKET_URL   = window.location.origin;

const urlParams = new URLSearchParams(window.location.search);
const token     = urlParams.get('token');

let socket       = null;
let currentRating = 0;

// ── Status Maps ──────────────────────────────────────
const STATUS_CLASS = {
    PENDING:       'pending',
    CONFIRMED:     'confirmed',
    IN_PROGRESS:   'in-progress',
    WAITING_PARTS: 'waiting-parts',
    READY:         'ready',
    COMPLETED:     'completed',
    DELIVERED:     'delivered',
    CANCELLED:     'cancelled',
};

const STATUS_TEXT = {
    PENDING:       'قيد الانتظار',
    CONFIRMED:     'مؤكد',
    IN_PROGRESS:   'قيد العمل',
    WAITING_PARTS: 'بانتظار القطع',
    READY:         'جاهز للاستلام',
    COMPLETED:     'مكتمل',
    DELIVERED:     'تم التسليم',
    CANCELLED:     'ملغي',
};

const STATUS_ICON = {
    PENDING:       'fas fa-clock',
    CONFIRMED:     'fas fa-circle-check',
    IN_PROGRESS:   'fas fa-gear fa-spin',
    WAITING_PARTS: 'fas fa-boxes-stacked',
    READY:         'fas fa-flag-checkered',
    COMPLETED:     'fas fa-circle-check',
    DELIVERED:     'fas fa-handshake',
    CANCELLED:     'fas fa-circle-xmark',
};

// Journey timeline definition (ordered stages)
const JOURNEY = [
    { key:'PENDING',       label:'استلام الحجز',    desc:'تم استلام طلب الحجز وهو في قائمة الانتظار',    icon:'fas fa-hourglass-start' },
    { key:'CONFIRMED',     label:'تأكيد الحجز',     desc:'تم تأكيد موعدك من قِبل المرآب',                icon:'fas fa-circle-check' },
    { key:'IN_PROGRESS',   label:'قيد العمل',        desc:'الفنيون يعملون على سيارتك الآن',               icon:'fas fa-wrench' },
    { key:'WAITING_PARTS', label:'بانتظار القطع',    desc:'تم طلب القطع اللازمة وهي في الطريق',           icon:'fas fa-boxes-stacked' },
    { key:'READY',         label:'جاهز للاستلام',   desc:'سيارتك جاهزة — يمكنك استلامها الآن',           icon:'fas fa-flag-checkered' },
    { key:'COMPLETED',     label:'مكتمل',            desc:'تمت الخدمة بنجاح',                             icon:'fas fa-circle-check' },
    { key:'DELIVERED',     label:'تم التسليم',       desc:'تم تسليم السيارة للعميل',                      icon:'fas fa-handshake' },
];

const CANCELLED_STAGE = { key:'CANCELLED', label:'ملغي', desc:'تم إلغاء هذا الحجز', icon:'fas fa-circle-xmark' };

// ── Init ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initSpotlight();
    initAOS();

    if (!token) { showError('رمز الحجز غير موجود أو منتهي الصلاحية'); return; }

    loadBookingDetails();
    initSocket();
    initRatingStars();
});

// ── AOS ───────────────────────────────────────────────
function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 500, once: true, offset: 30, easing: 'ease-out-cubic' });
    }
}

// ── Spotlight cursor ─────────────────────────────────
function initSpotlight() {
    const el = document.getElementById('spotlight');
    if (!el) return;
    document.addEventListener('mousemove', e => {
        el.style.setProperty('--mx', e.clientX + 'px');
        el.style.setProperty('--my', e.clientY + 'px');
    });
}

// ── Canvas Particles ─────────────────────────────────
function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, particles = [];
    const COUNT = 55;
    const COLORS = ['rgba(227,30,36,', 'rgba(255,255,255,', 'rgba(150,10,10,'];

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function createParticle() {
        return {
            x:    Math.random() * W,
            y:    Math.random() * H,
            r:    Math.random() * 1.8 + 0.4,
            dx:   (Math.random() - 0.5) * 0.35,
            dy:   (Math.random() - 0.5) * 0.35,
            alpha:Math.random() * 0.5 + 0.1,
            color:COLORS[Math.floor(Math.random() * COLORS.length)],
        };
    }

    function init() {
        resize();
        particles = Array.from({ length: COUNT }, createParticle);
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color + p.alpha + ')';
            ctx.fill();

            p.x += p.dx;
            p.y += p.dy;

            if (p.x < -5) p.x = W + 5;
            if (p.x > W + 5) p.x = -5;
            if (p.y < -5) p.y = H + 5;
            if (p.y > H + 5) p.y = -5;
        });
        requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener('resize', () => { resize(); });
}

// ── Socket.io ─────────────────────────────────────────
function initSocket() {
    if (typeof io === 'undefined') return;
    try {
        socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

        socket.on('connect', () => {
            socket.emit('join-booking', { token });
        });

        socket.on('booking-updated', (data) => {
            if (data.publicToken === token || data.token === token) {
                flashStatusUpdate();
                loadBookingDetails();
            }
        });

        socket.on('connect_error', () => {
            // silent - polling fallback active
        });
    } catch (e) {
        // Socket.io not available
    }
}

function flashStatusUpdate() {
    const heroCard = document.getElementById('hero-card');
    if (!heroCard) return;
    heroCard.classList.add('status-change-flash');
    setTimeout(() => heroCard.classList.remove('status-change-flash'), 700);
}

// ── Load Data ─────────────────────────────────────────
async function loadBookingDetails() {
    try {
        const res = await fetch(`${API_BASE_URL}/public/booking/${token}`);
        if (res.status === 404) throw new Error('رمز الحجز غير صالح أو منتهي الصلاحية');
        if (!res.ok) throw new Error('فشل تحميل بيانات الحجز');
        const data = await res.json();
        displayBookingDetails(data.booking || data);
    } catch (err) {
        if (err.name === 'TypeError') showError('تعذّر الاتصال بالخادم');
        else showError(err.message);
    }
}

// ── Display ───────────────────────────────────────────
function displayBookingDetails(booking) {
    const loadingEl        = document.getElementById('loading');
    const bookingDetailsEl = document.getElementById('booking-details');
    if (!bookingDetailsEl) return;

    if (loadingEl) loadingEl.classList.add('hidden');
    bookingDetailsEl.classList.remove('hidden');
    bookingDetailsEl.style.display = 'block';

    const status    = booking.status || 'PENDING';
    const statusCls = STATUS_CLASS[status] || 'pending';
    const statusTxt = STATUS_TEXT[status]  || status;
    const statusIco = STATUS_ICON[status]  || 'fas fa-clock';

    // ── Header badge
    const badge = document.getElementById('status-badge');
    badge.className = `status-badge ${statusCls}`;
    document.getElementById('status-icon').className = `status-icon ${statusIco}`;
    document.getElementById('status-text').textContent = statusTxt;

    // ── Hero card
    const vehicleMake  = booking.vehicle?.make  || '';
    const vehicleModel = booking.vehicle?.model || '';
    const vehicleYear  = booking.vehicle?.year  ? `(${booking.vehicle.year})` : '';
    document.getElementById('hero-vehicle-text').textContent =
        [vehicleMake, vehicleModel, vehicleYear].filter(Boolean).join(' ') || '—';
    document.getElementById('hero-customer-text').textContent = booking.customer?.fullName || '—';
    document.getElementById('hero-booking-id').textContent    = booking.id ? '#' + booking.id.substring(0, 8).toUpperCase() : '—';
    document.getElementById('last-updated').textContent       = new Date().toLocaleTimeString('ar-SY');
    document.getElementById('hero-eta').textContent           = booking.estimatedCompletionDate
        ? formatDateShort(booking.estimatedCompletionDate) : '—';

    // Hero ring
    const ring      = document.getElementById('hero-status-ring');
    const iconEl    = document.getElementById('hero-status-icon');
    const labelEl   = document.getElementById('hero-status-label');
    ring.className  = `hero-status-ring ${statusCls}`;
    iconEl.className = `hero-status-icon`;
    iconEl.innerHTML = `<i class="${statusIco}"></i>`;
    labelEl.textContent = statusTxt;

    // Hero glow color
    const heroGlow = document.getElementById('hero-glow');
    if (status === 'READY' || status === 'COMPLETED') {
        heroGlow.style.background = 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)';
    } else if (status === 'CANCELLED') {
        heroGlow.style.background = 'radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)';
    } else {
        heroGlow.style.background = 'radial-gradient(circle, rgba(227,30,36,0.25) 0%, transparent 70%)';
    }

    // ── Timeline
    renderTimeline(status);

    // ── Vehicle
    document.getElementById('vehicle-make').textContent  = booking.vehicle?.make         || '—';
    document.getElementById('vehicle-model').textContent = booking.vehicle?.model        || '—';
    document.getElementById('vehicle-year').textContent  = booking.vehicle?.year         || '—';
    document.getElementById('vehicle-plate').textContent = booking.vehicle?.licensePlate || booking.vehicle?.plateNumber || '—';

    // ── Services
    const servicesList = document.getElementById('services-list');
    const services     = booking.bookingServices || booking.services || [];
    if (services.length > 0) {
        servicesList.innerHTML = services.map((s, i) => `
            <div class="service-item" style="animation-delay:${i * 0.06}s">
                <div class="service-num">${i + 1}</div>
                <span class="service-name">${s.service?.name || s.name || s.description || '—'}</span>
            </div>
        `).join('');
    } else {
        servicesList.innerHTML = '<p class="muted-text" style="padding:4px 0">لا توجد خدمات مسجلة</p>';
    }

    // ── Mechanic notes
    const mechanicNotes = document.getElementById('mechanic-notes');
    const assignments   = booking.mechanicAssignments || [];
    const note = assignments.length > 0 ? assignments[0].notes : booking.mechanicNotes;
    mechanicNotes.innerHTML = note
        ? `<p>${note}</p>`
        : '<p class="muted-text">لا توجد ملاحظات من الفني حالياً</p>';

    // ── Company
    document.getElementById('company-name').textContent  = booking.tenant?.companyNameAr || booking.tenant?.companyName || booking.tenant?.name || 'Garage Go';
    document.getElementById('company-phone').textContent = booking.tenant?.phone || '—';

    // ── Invoice (hidden by default)
    if (booking.invoice) {
        const inv = booking.invoice;
        document.getElementById('subtotal').textContent  = formatCurrency(inv.subtotalSYP || inv.subtotal, inv.subtotalUSD);
        document.getElementById('tax').textContent       = formatCurrency(inv.taxSYP || inv.tax, inv.taxUSD);
        document.getElementById('discount').textContent  = formatCurrency(inv.discountSYP || inv.discount, inv.discountUSD);
        document.getElementById('total').textContent     = formatCurrency(inv.totalSYP || inv.total, inv.totalUSD);
        document.getElementById('paid').textContent      = formatCurrency(inv.paidSYP || inv.paid, inv.paidUSD);
        const remSYP = (inv.totalSYP || inv.total || 0) - (inv.paidSYP || inv.paid || 0);
        const remUSD = inv.totalUSD > 0 ? inv.totalUSD - (inv.paidUSD || 0) : null;
        document.getElementById('remaining').textContent = formatCurrency(remSYP, remUSD);
    }

    // ── Rating section
    const ratingSection = document.getElementById('rating-section');
    if (status === 'COMPLETED' || status === 'DELIVERED') {
        ratingSection.classList.remove('hidden');
    }

    // Refresh AOS
    if (typeof AOS !== 'undefined') setTimeout(() => AOS.refresh(), 100);
}

// ── Timeline Renderer ─────────────────────────────────
function renderTimeline(currentStatus) {
    const container = document.getElementById('status-timeline');
    if (!container) return;

    const isCancelled = currentStatus === 'CANCELLED';
    const journey     = isCancelled ? [...JOURNEY.slice(0, 2), CANCELLED_STAGE] : JOURNEY;

    // Find current index
    const currentIdx = journey.findIndex(s => s.key === currentStatus);
    const activeIdx  = currentIdx >= 0 ? currentIdx : 0;

    container.innerHTML = journey.map((stage, idx) => {
        let stateClass = 'pending';
        let extraBadge = '';

        if (isCancelled && stage.key === 'CANCELLED') {
            stateClass = 'cancelled';
        } else if (idx < activeIdx) {
            stateClass = 'done';
        } else if (idx === activeIdx) {
            stateClass = 'active';
            extraBadge = `<div class="timeline-badge-active"><span class="live-dot" style="width:6px;height:6px"></span> الحالة الآن</div>`;
        }

        return `
        <div class="timeline-item ${stateClass}" style="animation-delay:${idx * 0.08}s">
            <div class="timeline-node">
                <i class="${stage.icon}"></i>
            </div>
            <div class="timeline-content">
                <div class="timeline-title">${stage.label}</div>
                <div class="timeline-desc">${stage.desc}</div>
                ${extraBadge}
            </div>
        </div>
        `;
    }).join('');
}

// ── Error / Retry ─────────────────────────────────────
function showError(message) {
    document.getElementById('loading').classList.add('hidden');
    const errEl = document.getElementById('error');
    errEl.classList.remove('hidden');
    document.getElementById('error-message').textContent = message;
}

function retry() {
    document.getElementById('error').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    loadBookingDetails();
}

// ── Rating ────────────────────────────────────────────
function initRatingStars() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            currentRating = parseInt(star.dataset.rating);
            updateStars(currentRating);
        });
        star.addEventListener('mouseenter', () => updateStars(parseInt(star.dataset.rating)));
        star.addEventListener('mouseleave', () => updateStars(currentRating));
    });
}

function updateStars(rating) {
    document.querySelectorAll('.star').forEach((s, i) => {
        s.classList.toggle('active', i < rating);
    });
}

function submitRating() {
    if (currentRating === 0) {
        alert('يرجى اختيار تقييم أولاً');
        return;
    }
    const comment = document.getElementById('rating-comment').value;
    console.log('Rating submitted:', { rating: currentRating, comment, token });
    // TODO: POST to /api/public/booking/:token/rating
    alert('شكراً لتقييمك! رأيك يساعدنا على التحسين.');
    document.getElementById('rating-section').classList.add('hidden');
}

// ── Formatters ────────────────────────────────────────
function formatDate(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('ar-SY', {
        year:'numeric', month:'long', day:'numeric',
        hour:'2-digit', minute:'2-digit'
    });
}

function formatDateShort(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('ar-SY', {
        year:'numeric', month:'short', day:'numeric'
    });
}

function formatCurrency(syp, usd) {
    if (usd && usd > 0) return `${formatNum(syp)} SYP / ${formatNum(usd)} USD`;
    return `${formatNum(syp)} SYP`;
}

function formatNum(n) {
    if (!n) return '0';
    return new Intl.NumberFormat('ar-SY').format(n);
}

// ── Auto-refresh fallback ─────────────────────────────
setInterval(() => {
    const details = document.getElementById('booking-details');
    if (details && !details.classList.contains('hidden')) {
        loadBookingDetails();
    }
}, 30000);

// ── Cleanup ───────────────────────────────────────────
window.addEventListener('beforeunload', () => {
    if (socket) socket.disconnect();
});
