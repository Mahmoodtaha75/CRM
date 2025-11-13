    const DEFAULT_STUDENT_PASSWORD = "password123";
    const STUDENT_SESSION_KEY = "crm_student_session";

    (function () {
      const Admin_PASSCODE = "Admin123";
      const ACCOUNTANT_PASSCODE = "account123";

      // Get references to new segmented control buttons
      const roleBtnStudent = document.getElementById("roleBtnStudent");
      const roleBtnAdmin = document.getElementById("roleBtnAdmin");
      const roleBtnAccountant = document.getElementById("roleBtnAccountant");

      function getInitials(name) {
        const parts = String(name || "").trim().split(/\s+/).slice(0,2);
        const ini = parts.map(p => p[0]?.toUpperCase() || "").join("");
        return ini || "ST";
      }
      function formatCurrency(n) {
        const num = Number(n || 0);
        return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
      }

      const els = {
        body: document.body,
        roleSelect: document.getElementById("roleSelect"),
        enterAdminBtn: document.getElementById("enterAdminBtn"),
        enterAccountantBtn: document.getElementById("enterAccountantBtn"),
        roleLabel: document.getElementById("roleLabel"),
        roleChip: document.getElementById("roleChip"),
        modeNotice: document.getElementById("modeNotice"),
        form: document.getElementById("studentForm"),
        saveBtn: document.getElementById("saveBtn"),
        resetBtn: document.getElementById("resetBtn"),
        editHint: document.getElementById("editHint"),
        name: document.getElementById("name"),
        email: document.getElementById("email"),
        phone: document.getElementById("phone"),
        regNo: document.getElementById("regNo"),
        course: document.getElementById("course"),
        admissionDate: document.getElementById("admissionDate"),
        notes: document.getElementById("notes"),
        searchInput: document.getElementById("searchInput"),
        courseFilter: document.getElementById("courseFilter"),
        studentsTbody: document.getElementById("studentsTbody"),
        year: document.getElementById("year"),
        studentId: document.getElementById("studentId"),
        studentLoginCard: document.getElementById("studentLoginCard"),
        studentSelfCard: document.getElementById("studentSelfCard"),
        studentLoginForm: document.getElementById("studentLoginForm"),
        loginStudentId: document.getElementById("loginStudentId"),
        loginPassword: document.getElementById("loginPassword"),
        studentPasswordForm: document.getElementById("studentPasswordForm"),
        newPassword: document.getElementById("newPassword"),
        confirmPassword: document.getElementById("confirmPassword"),
        studentLogoutBtn: document.getElementById("studentLogoutBtn"),
        studentDetails: document.getElementById("studentDetails"),
        studentWelcome: document.getElementById("studentWelcome"),
        photo: document.getElementById("photo"),
        photoPreview: document.getElementById("photoPreview"),
        removePhotoBtn: document.getElementById("removePhotoBtn"),
        studentAvatarContainer: document.getElementById("studentAvatarContainer"),
        studentFeesTbody: document.getElementById("studentFeesTbody"),

        studentDetailModal: document.getElementById("studentDetailModal"),
        closeStudentDetail: document.getElementById("closeStudentDetail"),
        studentDetailContent: document.getElementById("studentDetailContent"),
        studentDetailFees: document.getElementById("studentDetailFees"),

        acctCard: document.getElementById("acctCard"),
        acctForm: document.getElementById("acctForm"),
        acctStudentSelect: document.getElementById("acctStudentSelect"),
        feeAmount: document.getElementById("feeAmount"),
        feeReceipt: document.getElementById("feeReceipt"),
        feeDate: document.getElementById("feeDate"),
        feeNote: document.getElementById("feeNote"),
        acctFeesTbody: document.getElementById("acctFeesTbody"),

        roleBtnStudent: document.getElementById("roleBtnStudent"),
        roleBtnAdmin: document.getElementById("roleBtnAdmin"),
        roleBtnAccountant: document.getElementById("roleBtnAccountant"),
      };

      const state = {
        role: "student",
        editingId: null,
        students: [],
        filters: { search: "", course: "" },
        studentSession: null,
        accountantSelectedId: null,
      };

      let photoDataPending = null;

      function uid() {
        return "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      }

      function load() {
        try {
          const raw = localStorage.getItem("crm_students");
          state.students = raw ? JSON.parse(raw) : [];
        } catch {
          state.students = []; // Fallback if storage is corrupted
        }
        try {
          const savedRole = localStorage.getItem("crm_role");
          if (savedRole === "Admin" || savedRole === "student" || savedRole === "accountant") {
            state.role = savedRole;
          }
        } catch {}
        try {
          const sess = localStorage.getItem(STUDENT_SESSION_KEY);
          state.studentSession = sess ? JSON.parse(sess) : null;
        } catch {
          state.studentSession = null;
        }
        // Ensure fees is always an array
        state.students = state.students.map(s => ({ ...s, fees: Array.isArray(s.fees) ? s.fees : [] }));
      }

      function persist() {
        // Only save students and role to localStorage
        localStorage.setItem("crm_students", JSON.stringify(state.students));
        localStorage.setItem("crm_role", state.role);
        if (state.studentSession) {
          localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(state.studentSession));
        } else {
          localStorage.removeItem(STUDENT_SESSION_KEY);
        }
      }

      function isValidStudentId(id) {
        // Checks if an ID is exactly 4 digits and numeric.
        return /^\d{4}$/.test(id);
      }
      function generateNextStudentId() {
        // Finds the next available 4-digit student ID.
        const usedIds = new Set();
        for (const s of state.students) {
          const studentId = (s.studentId || "").trim();
          if (isValidStudentId(studentId)) {
            usedIds.add(parseInt(studentId, 10));
          }
        }

        for (let n = 1; n <= 9999; n++) {
          if (!usedIds.has(n)) {
            return String(n).padStart(4, "0");
          }
        }
        return null; // No available IDs
      }

      function setRole(nextRole) {
        state.role = nextRole;
        persist();

        els.body.classList.remove("role-student", "role-Admin", "role-accountant");
        els.body.classList.add(`role-${state.role}`);

        if (els.roleBtnStudent && els.roleBtnAdmin && els.roleBtnAccountant) {
          const pressed = { student: "false", Admin: "false", accountant: "false" };
          pressed[state.role] = "true";
          els.roleBtnStudent.setAttribute("aria-pressed", pressed.student);
          els.roleBtnStudent.setAttribute("aria-selected", pressed.student);
          els.roleBtnAdmin.setAttribute("aria-pressed", pressed.Admin);
          els.roleBtnAdmin.setAttribute("aria-selected", pressed.Admin);
          els.roleBtnAccountant.setAttribute("aria-pressed", pressed.accountant);
          els.roleBtnAccountant.setAttribute("aria-selected", pressed.accountant);
        }

       
        if (state.role === "Admin") {
          els.roleLabel.textContent = "Admin (manage)";
          els.roleLabel.className = "chip--Admin";
          els.modeNotice.textContent = "You are in Admin mode. Adding, editing, and deleting enabled.";
          els.saveBtn.disabled = false;
          els.saveBtn.removeAttribute("aria-disabled");
          if (els.studentLoginCard) els.studentLoginCard.style.display = "none";
          if (els.studentSelfCard) els.studentSelfCard.style.display = "none";
        } else if (state.role === "accountant") {
          els.roleLabel.textContent = "Accountant (fees)";
          els.roleLabel.className = "chip--Admin"; // reuse chip styling
          els.modeNotice.textContent = "You are in Accountant mode. You can add fee payments for students.";
          els.saveBtn.disabled = true;
          els.saveBtn.setAttribute("aria-disabled", "true");
          if (els.studentLoginCard) els.studentLoginCard.style.display = "none";
          if (els.studentSelfCard) els.studentSelfCard.style.display = "none";
          if (els.feeDate) {
            const today = new Date().toISOString().slice(0,10);
            els.feeDate.value = today;
          }
          renderAccountantSelect();
          renderAccountantFees();
        } else {
          // student
          els.roleLabel.textContent = "Student (view-only)";
          els.roleLabel.className = "chip--student";
          els.modeNotice.textContent = "You are in Student mode. View your profile and fees.";
          els.saveBtn.disabled = true;
          els.saveBtn.setAttribute("aria-disabled", "true");
          if (state.studentSession?.studentId) showStudentSelf(); else showStudentLogin();
        }

        render(); 
      }

      // Function to handle file uploads for profile photos
      function handlePhotoUpload(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) {
          photoDataPending = null; // Reset if no file is selected
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          photoDataPending = reader.result; // Store as data URL
          if (els.photoPreview) {
            els.photoPreview.src = photoDataPending;
            els.photoPreview.style.display = "inline-block";
          }
        };
        reader.onerror = () => {
          alert("Error reading file.");
          photoDataPending = null;
          e.target.value = ""; // Clear input
        };
        reader.readAsDataURL(file);
      }

      // Event listener for file upload for profile photo
      if (els.photo) {
        els.photo.addEventListener("change", handlePhotoUpload);
      }
      // Event listener for removing the profile photo
      if (els.removePhotoBtn) {
        els.removePhotoBtn.addEventListener("click", () => {
          photoDataPending = "";
          if (els.photo) els.photo.value = ""; 
          if (els.photoPreview) {
            els.photoPreview.src = "";
            els.photoPreview.style.display = "none";
          }
        });
      }

      // Function to get form data for a new or updated student
      function getFormData() {
        const data = {
          name: els.name.value.trim(),
          email: els.email.value.trim(),
          phone: els.phone.value.trim(),
          regNo: (els.regNo?.value || "").trim(),
          course: els.course.value,
          admissionDate: els.admissionDate.value,
          notes: els.notes.value.trim(),
        };
        if (els.studentId) data.studentId = (els.studentId.value || "").trim();
        // The photo data is handled by `photoDataPending`
        return data;
      }

      // Function to populate the form with existing student data
      function setFormData(data) {
        els.name.value = data.name || "";
        els.email.value = data.email || "";
        els.phone.value = data.phone || "";
        if (els.regNo) els.regNo.value = data.regNo || "";
        els.course.value = data.course || "";
        els.admissionDate.value = data.admissionDate || "";
        els.notes.value = data.notes || "";
        if (els.studentId) els.studentId.value = data.studentId || "";

        // Show profile photo preview if it exists
        const hasPhoto = !!(data && data.photo);
        if (els.photoPreview) {
          if (hasPhoto) {
            els.photoPreview.src = data.photo;
            els.photoPreview.style.display = "inline-block";
          } else {
            els.photoPreview.src = "";
            els.photoPreview.style.display = "none";
          }
        }
        photoDataPending = null; // Reset the pending photo data
      }

      // Function to clear and reset the student form
      function clearForm() {
        state.editingId = null; // Exit edit mode
        els.form.reset();
        els.editHint.textContent = "";
        els.saveBtn.textContent = "Save Student"; // Reset button text
        photoDataPending = null; // Clear pending photo data
        if (els.photo) els.photo.value = ""; // Clear file input
        if (els.photoPreview) {
          els.photoPreview.src = "";
          els.photoPreview.style.display = "none";
        }
        // Ensure student ID field is reset if it was populated
        if (els.studentId) els.studentId.value = "";
      }

      // Function to handle saving/updating a student
      async function upsertStudent(ev) {
        console.log("[v0] upsertStudent invoked", { role: state.role, editingId: state.editingId });
        ev.preventDefault();
        if (state.role !== "Admin") {
          alert("Only Admins can save student information.");
          return;
        }
        const data = getFormData();

        // If no pending photo yet but a file is selected, read it now (ensures photo persists)
        let localPhotoData = photoDataPending;
        const fileInput = els.photo;
        const file = (fileInput && fileInput.files && fileInput.files[0]) ? fileInput.files[0] : null;

        if (localPhotoData === null && file) { // Check if photoDataPending is null and a new file is selected
          localPhotoData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Photo read failed"));
            reader.readAsDataURL(file);
          }).catch(() => null);
        }
        console.log("[v0] form data collected", { hasPendingPhoto: photoDataPending !== null, pendingLen: photoDataPending ? String(photoDataPending).length : 0, localLoaded: !!localPhotoData });

        // Basic validation
        if (!data.name || !data.email || !data.course || !data.admissionDate) {
          alert("Please fill in all required fields (Name, Email, Course, Admission Date).");
          return;
        }

        // Validate student ID for editing
        if (state.editingId && !isValidStudentId(data.studentId)) {
          alert("Student ID must be exactly 4 digits (e.g., 0001).");
          return;
        }
        // Validate course selection
        if (!validateCourse(data.course)) {
          alert("Invalid course selected. Allowed courses are: BCA, B.Com, BSc.");
          return;
        }
        // Validate phone number format
        if (data.phone && !/^\d{10}$/.test(data.phone)) {
          alert("Phone number must be exactly 10 digits (no spaces or characters).");
          return;
        }

        // Handle update scenario
        if (state.editingId) {
          const idx = state.students.findIndex(s => s.id === state.editingId);
          if (idx >= 0) {
            // Check for duplicate Student ID before updating
            const duplicate = state.students.some((x, i) => i !== idx && (x.studentId || "") === data.studentId);
            if (duplicate) {
              alert("Another student already has this Student ID. It must be unique.");
              return;
            }

            const merged = { ...state.students[idx], ...data, updatedAt: new Date().toISOString() };
            if (photoDataPending !== null || localPhotoData !== null) { 
              merged.photo = photoDataPending || localPhotoData || "";
            } else if (data.photo === "") { 
              merged.photo = "";
            }
            // Ensure the fees array is preserved
            if (!Array.isArray(merged.fees)) merged.fees = [];
            state.students[idx] = merged;

            persist();
            clearForm();
            render();
          }
        } else { // Handle new student creation
          const nextId = generateNextStudentId();
          if (!nextId) {
            alert("All 4-digit Student IDs are currently in use. Cannot create more students.");
            return;
          }

          const newStudent = {
            id: uid(), // Unique internal ID
            password: DEFAULT_STUDENT_PASSWORD, // Set default password
            ...data,
            studentId: nextId, // Assign the generated 4-digit ID
            photo: localPhotoData || (photoDataPending || ""), // Use loaded data or pending if no new file was read
            fees: [], // Initialize fees as an empty array
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          console.log("[v0] creating student", { studentId: newStudent.studentId, name: newStudent.name, hasPhoto: !!newStudent.photo });

          state.students.unshift(newStudent); // Add new student to the top
          persist();
          clearForm();
          render();
        }
      }

      function editStudent(id) {
        if (state.role !== "Admin") return; // Only Admins can edit
        const s = state.students.find(x => x.id === id);
        if (!s) return;

        state.editingId = id; 
        setFormData(s); 
        els.saveBtn.textContent = "Update Student"; // Change button text
        els.editHint.textContent = "Editing existing student. Click Reset to cancel.";
        window.scrollTo({ top: 0, behavior: "smooth" }); 
      }

      // Function to delete a student
      function deleteStudent(id) {
        if (state.role !== "Admin") return; // Only Admins can delete
        const s = state.students.find(x => x.id === id);
        if (!s) return;

        if (!confirm(`Are you sure you want to delete ${escapeHtml(s.name)}? This action cannot be undone.`)) {
          return; 
        }

        state.students = state.students.filter(x => x.id !== id); // Remove student from array
        persist();
        render(); // Re-render the table
      }

      // Function to render table rows for students
      function renderTableRows(students) {
        if (students.length === 0) {
          return `
            <tr>
              <td colspan="9" class="muted">No students found matching your criteria.</td>
            </tr>
          `;
        }
        return students.map(s => {
          // Action buttons for each row
          const actions = `
            <div class="actions">
              <button class="btn secondary" data-action="view" data-id="${s.id}">View</button>
              <button class="btn secondary" data-action="edit" data-id="${s.id}" ${state.role !== "Admin" ? 'aria-disabled="true" disabled' : ''}>Edit</button>
              <button class="btn danger" data-action="delete" data-id="${s.id}" ${state.role !== "Admin" ? 'aria-disabled="true" disabled' : ''}>Delete</button>
              <button class="btn secondary" data-action="resetpw" data-id="${s.id}" ${state.role !== "Admin" ? 'aria-disabled="true" disabled' : ''}>Reset Password</button>
            </div>
          `;
          const isRowClickable = (state.role === "Admin" || state.role === "accountant");
          const rowAttrs = `data-row-id="${s.id}" ${isRowClickable ? 'class="clickable-row"' : ""}`;
          return `
            <tr ${rowAttrs}>
              <td>${escapeHtml(s.studentId || "")}</td>
              <td>${escapeHtml(s.name)}</td>
              <td>${escapeHtml(s.regNo || "")}</td>
              <td>${escapeHtml(s.email)}</td>
              <td>${escapeHtml(s.phone || "")}</td>
              <td>${escapeHtml(s.course)}</td>
              <td>${escapeHtml(s.admissionDate)}</td>
              <td>${escapeHtml(s.notes || "")}</td>
              <td>${actions}</td>
            </tr>
          `;
        }).join("");
      }

      // Simple HTML escaping function to prevent XSS
      function escapeHtml(str) {
        return String(str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      // Function to apply search and course filters to the student list
      function applyFilters(list) {
        const q = state.filters.search.toLowerCase().trim();
        const course = state.filters.course;
        return list.filter(s => {
          const matchesCourse = course ? s.course === course : true; // Check course filter
          const matchesQuery = // Check search query
            !q ||
            s.name.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q) ||
            (s.phone || "").toLowerCase().includes(q) ||
            (s.regNo || "").toLowerCase().includes(q);
          return matchesCourse && matchesQuery;
        });
      }

      // Function to render the student's own profile view
      function renderStudentSelf() {
        const id = state.studentSession?.studentId;
        const s = id ? findStudentByStudentId(id) : null;
        if (!s) { // If student not found or session invalid
          studentLogout(); // Force logout
          return;
        }
        els.studentWelcome.textContent = `Welcome, ${escapeHtml(s.name)} (ID: ${escapeHtml(s.studentId || "")})`;

        // Display profile photo or initials
        if (els.studentAvatarContainer) {
          if (s.photo) {
            els.studentAvatarContainer.innerHTML = `<img src="${s.photo}" alt="Your profile photo" class="avatar" />`;
          } else {
            els.studentAvatarContainer.innerHTML = `<div class="avatar-initials" aria-hidden="true">${getInitials(s.name)}</div>`;
          }
        }

        // Display student's personal details
        els.studentDetails.innerHTML = `
          <div class="grid cols-3">
            <div><strong>Name</strong><br/>${escapeHtml(s.name)}</div>
            <div><strong>Student ID</strong><br/>${escapeHtml(s.studentId || "")}</div>
            <div><strong>Register No</strong><br/>${escapeHtml(s.regNo || "")}</div>
            <div><strong>Email</strong><br/>${escapeHtml(s.email)}</div>
            <div><strong>Phone</strong><br/>${escapeHtml(s.phone || "")}</div>
            <div><strong>Course</strong><br/>${escapeHtml(s.course)}</div>
            <div><strong>Admission Date</strong><br/>${escapeHtml(s.admissionDate)}</div>
            <div style="grid-column: 1 / -1;"><strong>Notes</strong><br/>${escapeHtml(s.notes || "")}</div>
          </div>
        `;

        // Render student's fee payments
        const fees = Array.isArray(s.fees) ? s.fees : [];
        const rows = fees.length ? fees.map(f => `
          <tr>
            <td>${escapeHtml(f.date || "")}</td>
            <td>${formatCurrency(f.amount)}</td>
            <td>${escapeHtml(f.receiptNo || "")}</td>
            <td>${escapeHtml(f.note || "")}</td>
          </tr>`).join("") : `<tr><td colspan="4" class="muted">No payments recorded yet.</td></tr>`;
        if (els.studentFeesTbody) els.studentFeesTbody.innerHTML = rows;
      }

      // Function to render the financial details section for accountants
      function renderFinancialDetails() {
        const id = state.studentSession?.studentId; // This seems to be intended for student view, not accountant.
        const s = id ? findStudentByStudentId(id) : null; // This find will likely fail for accountant
      }

      function renderFeeTableRows(studentId) {
        const s = studentId ? state.students.find(st => st.studentId === studentId) : null;
        const fees = s && Array.isArray(s.fees) ? s.fees : [];
        if (fees.length === 0) {
          return `
            <tr>
              <td colspan="4" class="muted">No payments found.</td>
            </tr>
          `;
        }
        return fees.map(f => {
          return `
            <tr>
              <td>${escapeHtml(f.date)}</td>
              <td>${formatCurrency(f.amount)}</td>
              <td>${escapeHtml(f.receiptNo)}</td>
              <td>${escapeHtml(f.note || "")}</td>
            </tr>
          `;
        }).join("");
      }

      // Main render function to update the student table
      function render() {
        const filteredStudents = applyFilters(state.students);
        els.studentsTbody.innerHTML = renderTableRows(filteredStudents);

        // Attach event listeners to action buttons after rendering
        els.studentsTbody.querySelectorAll("button[data-action]").forEach(btn => {
          const id = btn.getAttribute("data-id");
          const action = btn.getAttribute("data-action");
          btn.addEventListener("click", (e) => {
            if (action === "view") { e.stopPropagation(); openStudentDetail(id); return; }
            if (action === "edit") editStudent(id);
            if (action === "delete") deleteStudent(id);
            if (action === "resetpw") resetStudentPassword(id);
          });
        });

        // Update visibility of student-specific cards based on role and session
        if (state.role === "student") {
          if (state.studentSession?.studentId) {
            showStudentSelf();
          } else {
            showStudentLogin();
          }
        } else if (state.role === "accountant") {
          showFinancialDetails(); // This renders the general student info for accountants
          showAccountantCard(); // Ensure the accountant fee management section is visible
        }
      }

      // Show the student login form
      function showStudentLogin() {
        if (els.studentLoginCard) els.studentLoginCard.style.display = "block";
        if (els.studentSelfCard) els.studentSelfCard.style.display = "none";
        if (els.financialDetailsCard) els.financialDetailsCard.style.display = "none";
        if (els.acctCard) els.acctCard.style.display = "none"; // Hide accountant card in student mode
      }

      // Show the student's own profile view
      function showStudentSelf() {
        if (els.studentLoginCard) els.studentLoginCard.style.display = "none";
        if (els.studentSelfCard) els.studentSelfCard.style.display = "block";
        renderStudentSelf(); 
      }

      // Show the financial details section (for accountants)
      function showFinancialDetails() {
        if (els.studentLoginCard) els.studentLoginCard.style.display = "none";
        if (els.studentSelfCard) els.studentSelfCard.style.display = "none";
        if (els.financialDetailsCard) els.financialDetailsCard.style.display = "block";
      }

      // Show the accountant's fee management section
      function showAccountantCard() {
        if (els.acctCard) els.acctCard.style.display = "block";
      }

      // Handle student login attempt
      function studentLogin(ev) {
        ev.preventDefault();
        const studentIdInput = (els.loginStudentId.value || "").trim();
        const pwInput = (els.loginPassword.value || "").trim();

        if (!isValidStudentId(studentIdInput)) {
          alert("Student ID must be exactly 4 digits.");
          return;
        }
        const s = findStudentByStudentId(studentIdInput); // Find student by their 4-digit ID
        if (!s) {
          alert("No student found with this ID. Please check with your Admin.");
          return;
        }
        // Use default password if student has none or it's invalid
        const currentPw = s.password || DEFAULT_STUDENT_PASSWORD;
        if (pwInput !== currentPw) {
          alert("Incorrect password.");
          return;
        }

        state.studentSession = { studentId: studentIdInput }; // Store logged-in student ID
        persist(); // Save session to localStorage
        showStudentSelf(); // Switch to the student self-view
      }

      // Handle student logout
      function studentLogout() {
        state.studentSession = null; // Clear session state
        localStorage.removeItem(STUDENT_SESSION_KEY); // Remove session from localStorage
        showStudentLogin(); // Show the login form again
      }

      // Handle student password change
      function studentChangePassword(ev) {
        ev.preventDefault();
        const np = (els.newPassword.value || "").trim();
        const cp = (els.confirmPassword.value || "").trim();

        if (np.length < 6) {
          alert("New password must be at least 6 characters long.");
          return;
        }
        if (np !== cp) {
          alert("New passwords do not match.");
          return;
        }

        const id = state.studentSession?.studentId;
        const s = id ? findStudentByStudentId(id) : null;
        if (!s) {
          alert("Your session is invalid. Please log in again.");
          studentLogout();
          return;
        }

        s.password = np; // Update password
        persist(); // Save changes
        // Clear password fields and show success message
        els.newPassword.value = "";
        els.confirmPassword.value = "";
        alert("Password updated successfully.");
      }

      // Function for Admins to reset a student's password
      function resetStudentPassword(id) {
        if (state.role !== "Admin") return;
        const idx = state.students.findIndex(s => s.id === id); // Find student by internal ID
        if (idx < 0) return;

        state.students[idx].password = DEFAULT_STUDENT_PASSWORD; // Reset to default
        persist();
        alert("Password reset to default for this student.");
      }

      function validateCourse(value) {
        return ["BCA", "B.Com", "BSc"].includes(value);
      }

      // Find a student by their 4-digit studentId
      function findStudentByStudentId(id) {
        return state.students.find(s => (s.studentId || "") === id);
      }

      // Open the modal to display detailed student information for Admins
      function openStudentDetail(internalId) {
        if (!(state.role === "Admin" || state.role === "accountant")) return;
        const s = state.students.find(x => x.id === internalId); // Find by internal ID
        if (!s) return;

        // Generate avatar HTML
        const avatarHtml = s.photo
          ? `<img src="${s.photo}" alt="Profile photo of ${escapeHtml(s.name)}" class="avatar" />`
          : `<div class="avatar-initials" aria-hidden="true">${getInitials(s.name)}</div>`;

        els.studentDetailContent.innerHTML = `
          <div class="actions" style="align-items:center; gap: 1rem; margin-bottom: 0.5rem;">
            ${avatarHtml}
            <div><strong>${escapeHtml(s.name)}</strong><br/><span class="muted">ID: ${escapeHtml(s.studentId || "")}</span></div>
          </div>
          <div class="grid cols-3">
            <div><strong>Register No</strong><br/>${escapeHtml(s.regNo || "")}</div>
            <div><strong>Email</strong><br/>${escapeHtml(s.email)}</div>
            <div><strong>Phone</strong><br/>${escapeHtml(s.phone || "")}</div>
            <div><strong>Course</strong><br/>${escapeHtml(s.course)}</div>
            <div><strong>Admission Date</strong><br/>${escapeHtml(s.admissionDate)}</div>
            <div style="grid-column: 1 / -1;"><strong>Notes</strong><br/>${escapeHtml(s.notes || "")}</div>
          </div>
        `;

        // Render fee payments within the modal
        const fees = Array.isArray(s.fees) ? s.fees : [];
        const rows = fees.length ? fees.map(f => `
          <tr>
            <td>${escapeHtml(f.date || "")}</td>
            <td>${formatCurrency(f.amount)}</td>
            <td>${escapeHtml(f.receiptNo || "")}</td>
            <td>${escapeHtml(f.note || "")}</td>
          </tr>
        `).join("") : `<tr><td colspan="4" class="muted">No payments recorded.</td></tr>`;
        els.studentDetailFees.innerHTML = `
          <h3 style="margin-top: var(--space-5);">Payments</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Amount</th><th>Receipt No</th><th>Note</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        `;

        // Show the modal
        els.studentDetailModal.style.display = "flex";
        els.studentDetailModal.setAttribute("aria-hidden", "false");
      }

      // Close the student details modal
      function closeStudentDetailModal() {
        els.studentDetailModal.style.display = "none";
        els.studentDetailModal.setAttribute("aria-hidden", "true");
      }

      // Handle adding a fee payment by an accountant
      function accountantAddFee(ev) {
        ev.preventDefault();
        if (state.role !== "accountant") {
          alert("Only accountants can add fee payments.");
          return;
        }
        const selectedStudentId = els.acctStudentSelect.value; // This is the internal student ID
        const amount = parseFloat(els.feeAmount.value);
        const receiptNo = (els.feeReceipt.value || "").trim();
        const date = (els.feeDate.value || "").trim();
        const note = (els.feeNote.value || "").trim();

        // Basic validation for fee entry
        if (!selectedStudentId) { alert("Please select a student first."); return; }
        if (!(amount >= 0)) { alert("Please enter a valid payment amount."); return; }
        if (!receiptNo) { alert("Receipt Number is required."); return; }
        if (!date) { alert("Payment Date is required."); return; }

        const s = state.students.find(x => x.id === selectedStudentId); // Find student by internal ID
        if (!s) { alert("Selected student not found. Please refresh."); return; }
        if (!Array.isArray(s.fees)) s.fees = []; // Ensure fees array exists

        // Add the new fee entry
        s.fees.unshift({
          id: uid(), // Unique ID for the fee entry
          amount: amount,
          receiptNo: receiptNo,
          date: date,
          note: note,
          createdAt: new Date().toISOString(),
        });
        persist(); // Save changes to localStorage

        // Reset form fields except date and student selection
        els.feeAmount.value = "";
        els.feeReceipt.value = "";
        els.feeNote.value = "";
        renderAccountantFees(); // Refresh the fee table for the selected student
      }

      function renderAccountantSelect() {
        if (!els.acctStudentSelect) return;
        const options = state.students.map(s => `<option value="${s.id}">${escapeHtml(s.name)} — ID ${escapeHtml(s.studentId || "")}</option>`).join("");
        els.acctStudentSelect.innerHTML = `<option value="">Select a student</option>${options}`;
        // Restore previously selected student if available
        if (state.accountantSelectedId) {
          els.acctStudentSelect.value = state.accountantSelectedId;
          renderAccountantFees(); // Render fees for the pre-selected student
        }
      }

      // Render the fee payment table for the currently selected student (accountant mode)
      function renderAccountantFees() {
        if (!els.acctFeesTbody) return;
        const sid = state.accountantSelectedId; // Internal student ID
        if (!sid) { // No student selected
          els.acctFeesTbody.innerHTML = `<tr><td colspan="4" class="muted">Select a student above to view and add payments.</td></tr>`;
          return;
        }
        const s = state.students.find(x => x.id === sid);
        if (!s) { // Student not found
          els.acctFeesTbody.innerHTML = `<tr><td colspan="4" class="muted">Student data not found. Please refresh.</td></tr>`;
          return;
        }
        // Render the fee table rows
        const fees = Array.isArray(s.fees) ? s.fees : [];
        const rows = fees.length ? fees.map(f => `
          <tr>
            <td>${escapeHtml(f.date || "")}</td>
            <td>${formatCurrency(f.amount)}</td>
            <td>${escapeHtml(f.receiptNo || "")}</td>
            <td>${escapeHtml(f.note || "")}</td>
          </tr>
        `).join("") : `<tr><td colspan="4" class="muted">No payments have been recorded for this student yet.</td></tr>`;
        els.acctFeesTbody.innerHTML = rows;
      }

      // Event listener for student selection change in accountant mode
      if (els.acctStudentSelect) {
        els.acctStudentSelect.addEventListener("change", () => {
          state.accountantSelectedId = els.acctStudentSelect.value || null; // Store selected student's internal ID
          renderAccountantFees(); // Update the fee table
        });
      }
      // Event listener for the accountant's fee submission form
      if (els.acctForm) {
        els.acctForm.addEventListener("submit", accountantAddFee);
      }

      // Initialize the current year in the footer
      els.year.textContent = new Date().getFullYear();

      // Load data from localStorage on startup
      load();

      // Set the initial role based on loaded data and update segmented control
      els.roleSelect.value = state.role; // Set value of the hidden select
      setRole(state.role); // Apply the role settings

      // Helper function to update the segmented control based on current role
      function updateSegmentedControl() {
        roleBtnStudent.setAttribute("aria-selected", state.role === "student");
        roleBtnStudent.setAttribute("aria-pressed", state.role === "student");
        roleBtnAdmin.setAttribute("aria-selected", state.role === "Admin");
        roleBtnAdmin.setAttribute("aria-pressed", state.role === "Admin");
        roleBtnAccountant.setAttribute("aria-selected", state.role === "accountant");
        roleBtnAccountant.setAttribute("aria-pressed", state.role === "accountant");
      }

      // Update the segmented control on initial load
      updateSegmentedControl();

      // Populate with sample data if no students exist
      if (state.students.length === 0) {
        state.students = [];
        persist(); // Save sample data
        render(); // Render the table with sample data
      }

      // Ensure dropdowns and date inputs are populated correctly after DOM is ready
      document.addEventListener("DOMContentLoaded", () => {
        if (els.feeDate) {
          const today = new Date().toISOString().slice(0,10);
          els.feeDate.value = today;
        }
        renderAccountantSelect();
        renderAccountantFees();
      });

      // Event listeners for role selection buttons (using prompts for passcodes)
      els.enterAdminBtn.addEventListener("click", () => {
        const code = prompt("Enter Admin passcode:");
        if (code === Admin_PASSCODE) {
          els.roleSelect.value = "Admin"; // Update the select element
          setRole("Admin"); // Set the application role
        } else {
          alert("Incorrect passcode. You remain in your current mode.");
          els.roleSelect.value = state.role; // Reset select to current role
        }
      });

      els.enterAccountantBtn.addEventListener("click", () => {
        const code = prompt("Enter accountant passcode:");
        if (code === ACCOUNTANT_PASSCODE) {
          els.roleSelect.value = "accountant"; // Update the select element
          setRole("accountant"); // Set the application role
        } else {
          alert("Incorrect passcode. You remain in your current mode.");
          els.roleSelect.value = state.role; // Reset select to current role
        }
      });

      if (els.roleBtnStudent) {
        els.roleBtnStudent.addEventListener("click", () => {
          els.roleSelect.value = "student";
          setRole("student");
        });
      }
      if (els.roleBtnAdmin) {
        els.roleBtnAdmin.addEventListener("click", () => {
          const code = prompt("Enter Admin passcode:");
          if (code === Admin_PASSCODE) {
            els.roleSelect.value = "Admin";
            setRole("Admin");
          } else {
            alert("Incorrect passcode. Staying in previous mode.");
          }
        });
      }
      if (els.roleBtnAccountant) {
        els.roleBtnAccountant.addEventListener("click", () => {
          const code = prompt("Enter accountant passcode:");
          if (code === ACCOUNTANT_PASSCODE) {
            els.roleSelect.value = "accountant";
            setRole("accountant");
          } else {
            alert("Incorrect passcode. Staying in previous mode.");
          }
        });
      }

      // Event listener for the role select dropdown
      els.roleSelect.addEventListener("change", () => {
        const wantedRole = els.roleSelect.value;
        if (wantedRole === "Admin") {
          const code = prompt("Enter Admin passcode:");
          if (code === Admin_PASSCODE) {
            setRole("Admin");
            updateSegmentedControl();
          } else {
            alert("Incorrect passcode. Staying in previous mode.");
            els.roleSelect.value = state.role; // Revert selection
          }
        } else if (wantedRole === "accountant") {
          const code = prompt("Enter accountant passcode:");
          if (code === ACCOUNTANT_PASSCODE) {
            setRole("accountant");
            updateSegmentedControl();
          } else {
            alert("Incorrect passcode. Staying in previous mode.");
            els.roleSelect.value = state.role; // Revert selection
          }
        } else { // Default to student role
          setRole("student");
          updateSegmentedControl();
        }
      });

      // Event listeners for student login and password management
      els.studentLoginForm.addEventListener("submit", studentLogin);
      els.studentPasswordForm.addEventListener("submit", studentChangePassword);
      els.studentLogoutBtn.addEventListener("click", studentLogout);

      // Event listener for the student table to handle clicks on rows or action buttons
      els.studentsTbody.addEventListener("click", function (e) {
        if (!(state.role === "Admin" || state.role === "accountant")) return;

        const target = e.target;
        if (!(target instanceof Element)) return;

        // If the click is on an action button, let its specific handler manage it
        if (target.closest('button[data-action]')) return;

        // If the click is on a clickable row (not a button), open student detail modal
        const tr = target.closest('tr[data-row-id]');
        if (!tr) return; // Not a row click
        const rowId = tr.getAttribute('data-row-id');
        if (rowId) openStudentDetail(rowId); // Open details modal
      });

      // Event listeners for the student details modal
      els.closeStudentDetail.addEventListener("click", closeStudentDetailModal);
      // Close modal if backdrop is clicked
      els.studentDetailModal.addEventListener("click", function (e) {
        if (e.target === els.studentDetailModal) {
          closeStudentDetailModal();
        }
      });

      els.form.addEventListener("submit", upsertStudent);

    })();