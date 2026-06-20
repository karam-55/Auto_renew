// API Configuration
const API_BASE_URL = '/api';

// State
let bookingData = null;
let publicTrackingId = null;

// DOM Elements
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');
const mainContent = document.getElementById('mainContent');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init() {
  try {
    // Extract publicTrackingId from URL
    publicTrackingId = extractPublicTrackingId();
    
    if (!publicTrackingId) {
      showError('معرف التتبع غير موجود في الرابط');
      return;
    }

    // Fetch booking data
    await fetchBookingData();
    
    // Render UI
    renderUI();
    
    // Show main content
    loading.style.display = 'none';
    mainContent.style.display = 'block';
    
  } catch (err) {
    console.error('Initialization error:', err);
    showError(err.message || 'حدث خطأ في تحميل البيانات');
  }
}

function extractPublicTrackingId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id') || urlParams.get('token') || urlParams.get('publicToken');
}

async function fetchBookingData() {
  const response = await fetch(`${API_BASE_URL}/public/tracking/${publicTrackingId}`);
  
  if (!response.ok) {
    throw new Error('فشل في جلب بيانات الحجز');
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'فشل في جلب بيانات الحجز');
  }
  
  bookingData = result.data;
}

function renderUI() {
  renderHeader();
  renderVehicleInfo();
  renderTimeline();
  renderSchedule();
  renderRequestedServices();
  renderAdditionalServices();
  renderInvoiceSummary();
  renderMembershipInfo();
  renderLoyaltyAndWallet();
  renderQRCode();
}

function renderHeader() {
  document.getElementById('bookingNumber').textContent = bookingData.bookingId || bookingData.id || '--';
  
  const statusBadge = document.getElementById('statusBadge');
  statusBadge.textContent = getStatusText(bookingData.status);
  statusBadge.className = `status-badge ${getStatusClass(bookingData.status)}`;
}

function renderVehicleInfo() {
  document.getElementById('vehiclePlate').textContent = bookingData.vehicle?.licensePlate || '--';
  document.getElementById('vehicleMake').textContent = bookingData.vehicle?.make || '--';
  document.getElementById('vehicleModel').textContent = bookingData.vehicle?.model || '--';
  document.getElementById('vehicleColor').textContent = bookingData.vehicle?.color || '--';
  document.getElementById('vehicleMileage').textContent = bookingData.vehicle?.currentKm ? `${bookingData.vehicle.currentKm} كم` : '--';
  document.getElementById('lastServiceDate').textContent = bookingData.vehicle?.lastServiceDate ? formatDate(new Date(bookingData.vehicle.lastServiceDate)) : '--';
  document.getElementById('nextServiceDate').textContent = bookingData.vehicle?.nextServiceDate ? formatDate(new Date(bookingData.vehicle.nextServiceDate)) : '--';
}

function renderTimeline() {
  const timeline = document.getElementById('timeline');
  const statuses = [
    { key: 'PENDING', label: 'قيد الانتظار', icon: '📋' },
    { key: 'IN_PROGRESS', label: 'قيد العمل', icon: '🔧' },
    { key: 'WAITING_PARTS', label: 'بانتظار القطع', icon: '⚙️' },
    { key: 'READY', label: 'جاهز', icon: '✅' },
    { key: 'DELIVERED', label: 'تم التسليم', icon: '🚗' }
  ];
  
  const currentStatusIndex = statuses.findIndex(s => s.key === bookingData.status);
  
  timeline.innerHTML = statuses.map((status, index) => {
    let itemClass = 'pending';
    if (index < currentStatusIndex) {
      itemClass = 'completed';
    } else if (index === currentStatusIndex) {
      itemClass = 'current';
    }
    
    return `
      <div class="timeline-item ${itemClass}">
        <div class="timeline-icon">${status.icon}</div>
        <div class="timeline-content">
          <div class="timeline-title">${status.label}</div>
          <div class="timeline-date">${itemClass === 'completed' ? 'مكتمل' : itemClass === 'current' ? 'الحالي' : 'بانتظار'}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderSchedule() {
  const container = document.getElementById('scheduleList');
  
  if (!bookingData.schedules || bookingData.schedules.length === 0) {
    container.innerHTML = '<p class="no-data">لا توجد مواعيد مجدولة</p>';
    return;
  }
  
  container.innerHTML = bookingData.schedules.map(schedule => {
    const technicianName = schedule.technician?.fullNameAr || schedule.technician?.fullNameEn || 'غير معروف';
    const serviceName = schedule.service?.nameAr || schedule.service?.name || 'خدمة غير محددة';
    const statusText = getScheduleStatusText(schedule.status);
    const statusClass = getScheduleStatusClass(schedule.status);
    const startTime = new Date(schedule.startTime);
    const endTime = new Date(schedule.endTime);
    
    return `
      <div class="schedule-item ${statusClass}">
        <div class="schedule-header">
          <div class="schedule-technician">${technicianName}</div>
          <div class="schedule-status ${statusClass}">${statusText}</div>
        </div>
        <div class="schedule-service">${serviceName}</div>
        <div class="schedule-time">
          <span class="time-label">الوقت:</span>
          <span class="time-value">${formatTime(startTime)} - ${formatTime(endTime)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function getScheduleStatusText(status) {
  const statusMap = {
    'SCHEDULED': 'مجدول',
    'IN_PROGRESS': 'قيد التنفيذ',
    'COMPLETED': 'مكتمل',
    'CANCELLED': 'ملغي'
  };
  return statusMap[status] || status;
}

function getScheduleStatusClass(status) {
  const classMap = {
    'SCHEDULED': 'scheduled',
    'IN_PROGRESS': 'in-progress',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled'
  };
  return classMap[status] || 'scheduled';
}

function formatTime(date) {
  return date.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' });
}

function renderRequestedServices() {
  const container = document.getElementById('requestedServices');
  
  if (!bookingData.services || bookingData.services.length === 0) {
    container.innerHTML = '<p class="no-data">لا توجد خدمات مطلوبة</p>';
    return;
  }
  
  container.innerHTML = bookingData.services.map(service => `
    <div class="service-item">
      <div class="service-info">
        <div class="service-name">${service.name}</div>
        <div class="service-price">${formatPrice(service.priceSYP)} ل.س</div>
      </div>
      <div class="service-actions">
        <div class="service-price-display">${formatPrice(service.priceSYP)} ل.س</div>
      </div>
    </div>
  `).join('');
}

function renderAdditionalServices() {
  const container = document.getElementById('additionalServices');
  
  // Filter for additional services (this would come from the API)
  const additionalServices = bookingData.additionalServices || [];
  
  if (additionalServices.length === 0) {
    container.innerHTML = '<p class="no-data">لا توجد خدمات إضافية</p>';
    return;
  }
  
  container.innerHTML = additionalServices.map(service => `
    <div class="service-item ${service.status === 'PENDING' ? 'pending' : ''}">
      <div class="service-info">
        <div class="service-name">${service.name}</div>
        <div class="service-price">${formatPrice(service.priceSYP)} ل.س</div>
      </div>
      <div class="service-actions">
        <div class="service-price-display">${formatPrice(service.priceSYP)} ل.س</div>
        ${service.status === 'PENDING' ? `
          <button class="btn-approve" onclick="approveService('${service.id}')" ${service.isApproving ? 'disabled' : ''}>
            ${service.isApproving ? 'جاري الموافقة...' : 'موافقة'}
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function renderInvoiceSummary() {
  const invoice = bookingData.invoice;
  
  if (!invoice) {
    document.getElementById('invoiceSummary').innerHTML = '<p class="no-data">لا توجد فاتورة بعد</p>';
    return;
  }
  
  document.getElementById('subtotal').textContent = formatPrice(invoice.subtotalSYP || 0) + ' ل.س';
  document.getElementById('tax').textContent = formatPrice(invoice.taxSYP || 0) + ' ل.س';
  document.getElementById('discount').textContent = formatPrice(invoice.discountSYP || 0) + ' ل.س';
  document.getElementById('total').textContent = formatPrice(invoice.totalSYP || 0) + ' ل.س';
  document.getElementById('paid').textContent = formatPrice(invoice.paidSYP || 0) + ' ل.س';
  
  const remaining = (invoice.totalSYP || 0) - (invoice.paidSYP || 0);
  document.getElementById('remaining').textContent = formatPrice(remaining) + ' ل.س';
}

function renderMembershipInfo() {
  const membership = bookingData.customerMembership;
  
  if (!membership) {
    document.getElementById('membershipInfo').innerHTML = '<p class="no-data">لا توجد عضوية نشطة</p>';
    return;
  }
  
  const plan = membership.membershipPlan;
  document.getElementById('membershipPlan').textContent = plan?.nameAr || plan?.name || '--';
  document.getElementById('membershipStatus').textContent = getMembershipStatusText(membership.status);
  document.getElementById('membershipEndDate').textContent = formatDate(new Date(membership.endDate));
  document.getElementById('remainingVisits').textContent = membership.remainingVisits !== null ? membership.remainingVisits : 'غير محدود';
}

function renderLoyaltyAndWallet() {
  const customer = bookingData.customer;
  
  if (!customer) {
    document.getElementById('loyaltyPoints').textContent = '--';
    document.getElementById('walletBalance').textContent = '--';
    return;
  }
  
  document.getElementById('loyaltyPoints').textContent = customer.loyaltyPoints || 0;
  document.getElementById('walletBalance').textContent = formatPrice(customer.walletBalance || 0);
}

function getMembershipStatusText(status) {
  const statusMap = {
    'ACTIVE': 'نشط',
    'EXPIRED': 'منتهي',
    'CANCELLED': 'ملغي'
  };
  return statusMap[status] || status;
}

function renderQRCode() {
  const qrCodeImg = document.getElementById('qrCode');
  const qrPlaceholder = document.getElementById('qrPlaceholder');
  
  // Generate QR code URL (this would come from the API)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`;
  
  qrCodeImg.src = qrCodeUrl;
  qrCodeImg.style.display = 'block';
  qrPlaceholder.style.display = 'none';
}

async function approveService(serviceId) {
  try {
    const service = bookingData.additionalServices.find(s => s.id === serviceId);
    if (!service) return;
    
    // Set loading state
    service.isApproving = true;
    renderAdditionalServices();
    
    // Call API
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingData.bookingId}/approve-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serviceId }),
    });
    
    if (!response.ok) {
      throw new Error('فشل في الموافقة على الخدمة');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'فشل في الموافقة على الخدمة');
    }
    
    // Update service status
    service.status = 'APPROVED';
    service.isApproving = false;
    
    // Re-render
    renderAdditionalServices();
    
    // Show success message
    alert('تمت الموافقة على الخدمة بنجاح');
    
  } catch (err) {
    console.error('Approve service error:', err);
    
    // Reset loading state
    const service = bookingData.additionalServices.find(s => s.id === serviceId);
    if (service) {
      service.isApproving = false;
      renderAdditionalServices();
    }
    
    alert('فشل في الموافقة على الخدمة: ' + err.message);
  }
}

function showError(message) {
  loading.style.display = 'none';
  errorMessage.textContent = message;
  error.style.display = 'block';
}

function getStatusText(status) {
  const statusMap = {
    'PENDING': 'قيد الانتظار',
    'IN_PROGRESS': 'قيد العمل',
    'WAITING_PARTS': 'بانتظار القطع',
    'READY': 'جاهز',
    'DELIVERED': 'تم التسليم'
  };
  return statusMap[status] || status;
}

function getStatusClass(status) {
  const classMap = {
    'PENDING': 'pending',
    'IN_PROGRESS': 'in-progress',
    'WAITING_PARTS': 'waiting-parts',
    'READY': 'ready',
    'DELIVERED': 'delivered'
  };
  return classMap[status] || 'pending';
}

function formatPrice(price) {
  return new Intl.NumberFormat('ar-SY').format(price || 0);
}
