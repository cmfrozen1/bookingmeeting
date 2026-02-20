// ========== ADMIN PAGE SPECIFIC ==========

// DOM Cache เฉพาะหน้า
$.adminUsers = document.getElementById('admin-users');
$.adminRooms = document.getElementById('admin-rooms');
$.adminBookings = document.getElementById('admin-bookings');
$.adminPending = document.getElementById('admin-pending');
$.pendingBadge = document.getElementById('pending-badge');
$.userSearch = document.getElementById('user-search');
$.adminBookingSearch = document.getElementById('admin-booking-search');
$.settingsSaveBtn = document.getElementById('settings-save-btn');
$.settingRequireApproval = document.getElementById('setting-require-approval');
$.settingReminderMinutes = document.getElementById('setting-reminder-minutes');

// เรียกเมื่อ user พร้อม
window.onUserReady = function() {
    if (!state.isManager) {
        window.location.href = 'index.html';
        return;
    }
    
    loadAdminData();
};

// โหลดข้อมูลทั้งหมด
async function loadAdminData() {
    try {
        await Promise.all([
            loadAdminStats(),
            loadUsers(),
            loadPendingBookings(),
            loadAllBookings(),
            loadRoomsManagement(),
            loadSettings()
        ]);
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

// โหลดสถิติ
async function loadAdminStats() {
    try {
        const result = await callGAS('admin/stats');
        if (result.success) {
            $.adminUsers.textContent = result.data.users || 0;
            $.adminRooms.textContent = result.data.rooms || 0;
            $.adminBookings.textContent = result.data.bookings || 0;
            $.adminPending.textContent = result.data.pending || 0;
        }
    } catch (error) {
        console.error('Load admin stats error:', error);
    }
}

// โหลดรายการรออนุมัติ
async function loadPendingBookings() {
    try {
        const result = await callGAS('admin/pending-bookings');
        if (result.success) {
            state.pendingBookings = result.data || [];
            renderPendingBookings();
            
            const count = state.pendingBookings.length;
            if (count > 0) {
                $.pendingBadge.textContent = count > 9 ? '9+' : count;
                $.pendingBadge.classList.remove('hidden');
            } else {
                $.pendingBadge.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Load pending bookings error:', error);
    }
}

// แสดงรายการรออนุมัติ
function renderPendingBookings() {
    const list = document.getElementById('pending-bookings-list');
    if (!list) return;
    
    if (!state.pendingBookings.length) {
        list.innerHTML = '<div class="text-center py-10 text-gray-400">ไม่มีรายการรออนุมัติ</div>';
        return;
    }

    list.innerHTML = state.pendingBookings.map(b => `
        <div class="bg-[#1a1d24] p-4 rounded-xl border border-yellow-500/30">
            <div class="flex justify-between mb-2">
                <span class="badge badge-pending">⏳ รออนุมัติ</span>
                <span class="text-xs text-gray-500">${formatDateTime(b.createdAt)}</span>
            </div>
            <h3 class="font-semibold mb-1">${b.title}</h3>
            <p class="text-sm text-[#06c755] mb-2">${b.roomName}</p>
            <p class="text-xs text-gray-400 mb-3">
                <i class="far fa-calendar mr-1"></i> ${formatDateShort(b.startTime)} - ${formatDateShort(b.endTime)}<br>
                <i class="far fa-clock mr-1"></i> ${formatTime(b.startTime)} - ${formatTime(b.endTime)}
            </p>
            <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">โดย: ${b.userName}</span>
                <div class="flex gap-2">
                    <button class="btn-success text-xs py-2 px-3" onclick="approveBooking('${b.bookingId}', this)">อนุมัติ</button>
                    <button class="btn-danger text-xs py-2 px-3" onclick="rejectBooking('${b.bookingId}', this)">ปฏิเสธ</button>
                </div>
            </div>
        </div>
    `).join('');
}

// อนุมัติการจอง
window.approveBooking = async function(bookingId, btn) {
    setButtonLoading(btn, true);
    
    const result = await callGAS('booking/approve', { bookingId });
    
    if (result.success) {
        showToast('อนุมัติการจองสำเร็จ');
        await Promise.all([
            loadPendingBookings(), 
            loadAdminStats(), 
            loadAllBookings()
        ]);
    } else {
        showToast(result.message || 'อนุมัติไม่สำเร็จ', 'error');
    }
    
    setButtonLoading(btn, false);
};

// ปฏิเสธการจอง
window.rejectBooking = async function(bookingId, btn) {
    setButtonLoading(btn, true);
    
    const result = await Swal.fire({
        title: 'ปฏิเสธการจอง',
        input: 'textarea',
        inputLabel: 'เหตุผลที่ปฏิเสธ',
        inputPlaceholder: 'ระบุเหตุผล...',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'ปฏิเสธ',
        cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
        const apiResult = await callGAS('booking/reject', { 
            bookingId,
            reason: result.value || 'ไม่ระบุเหตุผล'
        });
        
        if (apiResult.success) {
            showToast('ปฏิเสธการจองสำเร็จ');
            await Promise.all([
                loadPendingBookings(), 
                loadAdminStats(), 
                loadAllBookings()
            ]);
        } else {
            showToast(apiResult.message || 'ปฏิเสธไม่สำเร็จ', 'error');
        }
    }
    
    setButtonLoading(btn, false);
};

// โหลดการจองทั้งหมด
async function loadAllBookings() {
    try {
        const result = await callGAS('admin/all-bookings');
        if (result.success) {
            state.allBookings = result.data || [];
            renderAllBookings();
        }
    } catch (error) {
        console.error('Load all bookings error:', error);
    }
}

// แสดงการจองทั้งหมด
function renderAllBookings() {
    const list = document.getElementById('all-bookings-list');
    if (!list) return;
    
    const search = $.adminBookingSearch?.value.toLowerCase() || '';
    const filtered = state.allBookings.filter(b => 
        b.title?.toLowerCase().includes(search) || 
        b.userName?.toLowerCase().includes(search) ||
        b.roomName?.toLowerCase().includes(search)
    );

    if (!filtered.length) {
        list.innerHTML = '<p class="text-center text-gray-400 py-6">ไม่พบการจอง</p>';
        return;
    }

    list.innerHTML = filtered.map(b => {
        const statusClass = {
            'confirmed': 'badge-confirmed',
            'pending': 'badge-pending',
            'cancelled': 'badge-cancelled',
            'rejected': 'badge-rejected'
        }[b.status] || 'badge-pending';
        
        return `
        <div class="bg-[#1a1d24] p-3 rounded-lg border border-[#2a2e36]">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <span class="font-semibold text-sm">${b.title}</span>
                    <span class="text-xs text-gray-400 ml-2">${b.roomName}</span>
                </div>
                <span class="badge ${statusClass} text-xs">${b.status}</span>
            </div>
            <div class="flex justify-between text-xs text-gray-400">
                <span><i class="far fa-user mr-1"></i> ${b.userName}</span>
                <span><i class="far fa-clock mr-1"></i> ${formatDateShort(b.startTime)} - ${formatDateShort(b.endTime)}</span>
            </div>
        </div>
    `}).join('');
}

// โหลดรายชื่อผู้ใช้
async function loadUsers() {
    try {
        const result = await callGAS('admin/users');
        if (result.success) {
            state.users = result.data || [];
            renderUsers();
        }
    } catch (error) {
        console.error('Load users error:', error);
    }
}

// แสดงรายชื่อผู้ใช้
function renderUsers() {
    const list = document.getElementById('users-list');
    if (!list) return;
    
    const search = $.userSearch?.value.toLowerCase() || '';
    const filtered = state.users.filter(u => 
        u.displayName?.toLowerCase().includes(search) || 
        u.email?.toLowerCase().includes(search)
    );

    if (!filtered.length) {
        list.innerHTML = '<p class="text-center text-gray-400 py-6">ไม่พบผู้ใช้</p>';
        return;
    }

    list.innerHTML = filtered.map(u => `
        <div class="user-row">
            <img src="${u.pictureUrl || 'https://via.placeholder.com/40'}" class="user-avatar-sm" loading="lazy">
            <div class="flex-1">
                <p class="font-semibold text-sm">${u.displayName || ''}</p>
                <p class="text-xs text-gray-400">${u.email || ''}</p>
            </div>
            <span class="role-badge role-${u.role}">${{admin:'ผู้ดูแล', manager:'ผู้จัดการ', user:'ผู้ใช้'}[u.role]}</span>
            ${state.isAdmin ? `
                <button class="text-[#06c755] text-xs" onclick="showRoleModal('${u.lineUserId}', '${u.displayName}', '${u.role}')">
                    <i class="fas fa-cog"></i>
                </button>
            ` : ''}
        </div>
    `).join('');
}

// จัดการสิทธิ์ผู้ใช้
window.showRoleModal = function(userId, userName, currentRole) {
    document.getElementById('role-user-id').value = userId;
    document.getElementById('role-user-name').textContent = `จัดการสิทธิ์: ${userName}`;
    document.getElementById('user-role').value = currentRole;
    document.getElementById('role-modal').classList.add('active');
};

window.closeRoleModal = function() {
    document.getElementById('role-modal').classList.remove('active');
};

window.saveUserRole = async function(e) {
    e.preventDefault();
    
    const userId = document.getElementById('role-user-id').value;
    const role = document.getElementById('user-role').value;

    const saveBtn = e.submitter;
    setButtonLoading(saveBtn, true);

    const result = await callGAS('admin/user/role', {
        targetUserId: userId,
        role,
        lineUserId: state.user?.lineUserId
    });

    if (result.success) {
        showToast('อัปเดตสิทธิ์สำเร็จ');
        closeRoleModal();
        await loadUsers();
        
        // อัปเดตสิทธิ์ตัวเองถ้าเป็น user ปัจจุบัน
        if (userId === state.user?.lineUserId) {
            const userResult = await callGAS('user/profile', {
                lineUserId: state.user.lineUserId
            });
            if (userResult.success) {
                state.user = userResult.data;
                state.isAdmin = state.user.role === 'admin';
                state.isManager = state.isAdmin || state.user.role === 'manager';
                updateUserUI();
            }
        }
    } else {
        showToast(result.message || 'อัปเดตไม่สำเร็จ', 'error');
    }

    setButtonLoading(saveBtn, false);
};

// โหลดการตั้งค่า
async function loadSettings() {
    try {
        const result = await callGAS('admin/settings/get');
        
        if (result.success) {
            state.settings = result.data || {
                appName: 'Meeting Room',
                requireApproval: 'true',
                reminderMinutes: '30'
            };
            
            document.getElementById('setting-app-name').value = state.settings.appName || 'Meeting Room';
            
            if ($.settingRequireApproval) {
                const requireApproval = state.settings.requireApproval;
                let isChecked = false;
                
                if (typeof requireApproval === 'string') {
                    isChecked = requireApproval.toLowerCase() === 'true' || requireApproval === '1';
                } else if (typeof requireApproval === 'boolean') {
                    isChecked = requireApproval;
                } else if (typeof requireApproval === 'number') {
                    isChecked = requireApproval === 1;
                }
                
                $.settingRequireApproval.checked = isChecked;
            }
            
            if ($.settingReminderMinutes) {
                $.settingReminderMinutes.value = state.settings.reminderMinutes || '30';
            }
        }
    } catch (error) {
        console.error('Load settings error:', error);
    }
}

// บันทึกการตั้งค่า
window.saveSettings = async function(e) {
    e.preventDefault();
    
    const appName = document.getElementById('setting-app-name').value.trim() || 'Meeting Room';
    const requireApproval = $.settingRequireApproval ? $.settingRequireApproval.checked : true;
    const reminderMinutes = $.settingReminderMinutes?.value || '30';

    const saveBtn = $.settingsSaveBtn;
    setButtonLoading(saveBtn, true);

    const data = {
        appName,
        requireApproval: requireApproval ? 'true' : 'false',
        reminderMinutes,
        lineUserId: state.user?.lineUserId
    };

    const result = await callGAS('admin/settings/update', data);
    
    if (result.success) {
        showToast('บันทึกสำเร็จ');
        Object.assign(state.settings, data);
        
        // อัปเดตชื่อแอปใน navbar
        const navbarAppName = document.getElementById('navbar-app-name');
        if (navbarAppName) navbarAppName.textContent = appName;
    } else {
        showToast(result.message || 'บันทึกไม่สำเร็จ', 'error');
    }

    setButtonLoading(saveBtn, false);
};

// รีเซ็ตฐานข้อมูล
window.resetDatabase = async function() {
    if (!state.isAdmin) {
        showToast('เฉพาะผู้ดูแลระบบเท่านั้น', 'error');
        return;
    }
    
    const btn = event.target;
    setButtonLoading(btn, true);
    
    const result = await Swal.fire({
        title: 'รีเซ็ตฐานข้อมูล',
        text: 'คุณแน่ใจหรือไม่? ข้อมูลทั้งหมดจะถูกลบและกลับสู่ค่าเริ่มต้น',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'ใช่, รีเซ็ต',
        cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
        const apiResult = await callGAS('setupDatabase');
        if (apiResult.success) {
            showToast('รีเซ็ตฐานข้อมูลสำเร็จ');
            setTimeout(() => location.reload(), 1500);
        } else {
            showToast(apiResult.message || 'เกิดข้อผิดพลาด', 'error');
        }
    }
    
    setButtonLoading(btn, false);
};

// โหลดรายการห้อง (สำหรับจัดการ)
async function loadRoomsManagement() {
    try {
        const result = await callGAS('rooms');
        
        if (result.success) {
            const rooms = result.data || [];
            renderRoomsManagement(rooms);
        }
    } catch (error) {
        console.error('Load rooms management error:', error);
    }
}

function renderRoomsManagement(rooms) {
    const list = document.getElementById('rooms-management-list');
    if (!list) return;
    
    if (!rooms.length) {
        list.innerHTML = '<p class="text-center text-gray-400 py-6">ไม่มีห้องประชุม</p>';
        return;
    }

    list.innerHTML = rooms.map(room => `
        <div class="room-management-item">
            <div class="room-management-info">
                <div class="flex items-center gap-2">
                    <span class="font-semibold">${room.name}</span>
                    <span class="capacity-badge text-xs"><i class="fas fa-users mr-1"></i>${room.capacity}</span>
                </div>
                <p class="text-xs text-gray-400 mt-1">${room.location || 'ไม่มีสถานที่'}</p>
            </div>
            <div class="room-management-actions">
                <button class="text-[#06c755] text-sm" onclick="editRoom('${room.roomId}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-500 text-sm" onclick="deleteRoom('${room.roomId}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

window.editRoom = function(roomId) {
    const room = state.rooms.find(r => r.roomId === roomId);
    if (room) {
        showCreateRoomModal(room);
    }
};

window.deleteRoom = async function(roomId) {
    const room = state.rooms.find(r => r.roomId === roomId);
    if (!room) return;
    
    const result = await Swal.fire({
        title: 'ลบห้องประชุม',
        text: `คุณแน่ใจหรือไม่ว่าต้องการลบห้อง "${room.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'ใช่, ลบ',
        cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
        const apiResult = await callGAS('room/delete', { 
            roomId,
            lineUserId: state.user?.lineUserId
        });

        if (apiResult.success) {
            showToast('ลบห้องสำเร็จ');
            await Promise.all([
                loadRoomsManagement(),
                loadAdminStats()
            ]);
        } else {
            showToast(apiResult.message || 'ลบไม่สำเร็จ', 'error');
        }
    }
};

// แสดง modal สร้าง/แก้ไขห้อง
window.showCreateRoomModal = function(room = null) {
    const modal = document.getElementById('room-create-modal');
    const title = document.getElementById('room-modal-title');
    const roomId = document.getElementById('edit-room-id');
    const name = document.getElementById('room-name');
    const capacity = document.getElementById('room-capacity');
    const location = document.getElementById('room-location');
    const description = document.getElementById('room-description');
    const facilities = document.getElementById('room-facilities');
    const image = document.getElementById('room-image');
    const preview = document.getElementById('room-image-preview');
    
    if (room) {
        title.textContent = 'แก้ไขห้อง';
        roomId.value = room.roomId;
        name.value = room.name;
        capacity.value = room.capacity;
        location.value = room.location;
        description.value = room.description || '';
        facilities.value = room.facilities || '';
        image.value = room.imageUrl || '';
        
        if (room.imageUrl) {
            preview.src = room.imageUrl;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    } else {
        title.textContent = 'เพิ่มห้องใหม่';
        roomId.value = '';
        name.value = '';
        capacity.value = '';
        location.value = '';
        description.value = '';
        facilities.value = '';
        image.value = '';
        preview.style.display = 'none';
    }
    
    modal.classList.add('active');
};

window.closeRoomModal = function() {
    document.getElementById('room-create-modal').classList.remove('active');
};

window.saveRoom = async function(e) {
    e.preventDefault();
    
    const btn = document.getElementById('save-room-btn');
    if (btn.disabled) return;
    
    setButtonLoading(btn, true);

    try {
        const id = document.getElementById('edit-room-id').value;
        let imageUrl = document.getElementById('room-image').value;
        const file = document.getElementById('room-image-file').files[0];

        if (file) {
            const uploaded = await uploadImageToDrive(file);
            if (uploaded) imageUrl = uploaded;
        }

        const data = {
            name: document.getElementById('room-name').value,
            capacity: document.getElementById('room-capacity').value,
            location: document.getElementById('room-location').value,
            description: document.getElementById('room-description').value,
            facilities: document.getElementById('room-facilities').value,
            imageUrl,
            lineUserId: state.user?.lineUserId
        };

        if (id) data.roomId = id;

        const result = await callGAS(id ? 'room/update' : 'room/create', data);

        if (result.success) {
            showToast(id ? 'แก้ไขห้องสำเร็จ' : 'เพิ่มห้องสำเร็จ');
            closeRoomModal();
            await Promise.all([
                loadRoomsManagement(),
                loadAdminStats()
            ]);
        } else {
            showToast(result.message || 'เกิดข้อผิดพลาด', 'error');
        }
    } catch (error) {
        console.error('Save room error:', error);
        showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
};

// Event Listeners
document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.add('hidden'));
        document.getElementById(`admin-${btn.dataset.adminTab}-tab`).classList.remove('hidden');
        
        if (btn.dataset.adminTab === 'rooms') {
            loadRoomsManagement();
        } else if (btn.dataset.adminTab === 'bookings') {
            loadAllBookings();
        } else if (btn.dataset.adminTab === 'users') {
            loadUsers();
        } else if (btn.dataset.adminTab === 'pending') {
            loadPendingBookings();
        }
    });
});

$.userSearch?.addEventListener('input', renderUsers);
$.adminBookingSearch?.addEventListener('input', renderAllBookings);

document.getElementById('refresh-admin')?.addEventListener('click', () => {
    if (state.isManager) {
        loadAdminData();
    }
});
