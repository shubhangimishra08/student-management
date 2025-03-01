document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const loginContainer = document.getElementById('login-container');
    const dashboard = document.getElementById('dashboard');
    const currentUser = document.getElementById('current-user');
    const logoutBtn = document.getElementById('logout-btn');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // API Base URL
    const apiUrl = 'http://localhost:5000/api';
    
    // Check if user is logged in
    checkAuthStatus();
    
    // Login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        login(username, password);
    });
    
    // Logout button
    logoutBtn.addEventListener('click', function() {
        logout();
    });
    
    // Tab navigation
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            
            // Load tab-specific data
            if(tabName === 'attendance') {
                loadClasses().then(() => {
                    const dateSelect = document.getElementById('date-select');
                    dateSelect.value = new Date().toISOString().split('T')[0];
                });
            } else if(tabName === 'reports') {
                loadClasses('report-class');
                loadStudents('report-student');
                const today = new Date();
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(today.getMonth() - 1);
                
                document.getElementById('report-date-from').value = oneMonthAgo.toISOString().split('T')[0];
                document.getElementById('report-date-to').value = today.toISOString().split('T')[0];
            } else if(tabName === 'students') {
                loadClasses('student-class');
                loadClasses('filter-class');
                loadStudentList();
            }
        });
    });
    
    // Initialize event listeners for different sections
    initAttendanceSection();
    initReportsSection();
    initStudentsSection();
    
    // Function to check authentication status
    function checkAuthStatus() {
        const token = localStorage.getItem('token');
        if (token) {
            // Verify token validity
            fetch(`${apiUrl}/verify-token`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Invalid token');
                }
            })
            .then(data => {
                showDashboard(data.username);
                // Load initial data for the active tab
                document.querySelector('.tab-btn.active').click();
            })
            .catch(error => {
                console.error('Auth error:', error);
                localStorage.removeItem('token');
                showLogin();
            });
        } else {
            showLogin();
        }
    }
    
    // Function to handle login
    function login(username, password) {
        fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Login failed');
            }
        })
        .then(data => {
            localStorage.setItem('token', data.token);
            showDashboard(username);
            // Load initial data for the active tab
            document.querySelector('.tab-btn.active').click();
        })
        .catch(error => {
            alert('Login failed. Please check your credentials.');
            console.error('Login error:', error);
        });
    }
    
    // Function to handle logout
    function logout() {
        localStorage.removeItem('token');
        showLogin();
    }
    
    // Function to show login screen
    function showLogin() {
        loginContainer.style.display = 'block';
        dashboard.style.display = 'none';
        currentUser.textContent = 'Not logged in';
        logoutBtn.style.display = 'none';
    }
    
    // Function to show dashboard
    function showDashboard(username) {
        loginContainer.style.display = 'none';
        dashboard.style.display = 'block';
        currentUser.textContent = `Logged in as: ${username}`;
        logoutBtn.style.display = 'inline-block';
    }
    
    // Function to load classes into select elements
    function loadClasses(elementId = 'class-select') {
        return fetch(`${apiUrl}/classes`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to load classes');
            }
        })
        .then(classes => {
            const selectElement = document.getElementById(elementId);
            
            // Keep the first option and remove the rest
            while (selectElement.options.length > 1) {
                selectElement.remove(1);
            }
            
            classes.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.id;
                option.textContent = cls.name;
                selectElement.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading classes:', error);
        });
    }
    
    // Function to load students (for reports)
    function loadStudents(elementId = 'report-student') {
        return fetch(`${apiUrl}/students`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to load students');
            }
        })
        .then(students => {
            const selectElement = document.getElementById(elementId);
            
            // Keep the first option and remove the rest
            while (selectElement.options.length > 1) {
                selectElement.remove(1);
            }
            
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = `${student.name} (${student.id})`;
                selectElement.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading students:', error);
        });
    }

    // Initialize Attendance Section
    function initAttendanceSection() {
        const classSelect = document.getElementById('class-select');
        const dateSelect = document.getElementById('date-select');
        const attendanceList = document.getElementById('attendance-list');
        const saveAttendanceBtn = document.getElementById('save-attendance');
        
        // Set default date to today
        dateSelect.value = new Date().toISOString().split('T')[0];
        
        // Event listeners
        classSelect.addEventListener('change', loadAttendanceStudents);
        dateSelect.addEventListener('change', loadAttendanceStudents);
        saveAttendanceBtn.addEventListener('click', saveAttendance);
        
        function loadAttendanceStudents() {
            const classId = classSelect.value;
            const date = dateSelect.value;
            
            if (!classId || !date) {
                attendanceList.innerHTML = '<p>Please select a class and date.</p>';
                saveAttendanceBtn.disabled = true;
                return;
            }
            
            fetch(`${apiUrl}/attendance/students?class_id=${classId}&date=${date}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Failed to load student list');
                }
            })
            .then(data => {
                attendanceList.innerHTML = '';
                
                if (data.students.length === 0) {
                    attendanceList.innerHTML = '<p>No students found in this class.</p>';
                    saveAttendanceBtn.disabled = true;
                    return;
                }
                
                data.students.forEach(student => {
                    const studentItem = document.createElement('div');
                    studentItem.className = 'student-item';
                    studentItem.innerHTML = `
                        <div class="student-info">
                            <strong>${student.name}</strong> (ID: ${student.id})
                        </div>
                        <div class="attendance-options">
                            <label>
                                <input type="radio" name="attendance-${student.id}" value="present" ${student.status === 'present' ? 'checked' : ''}>
                                Present
                            </label>
                            <label>
                                <input type="radio" name="attendance-${student.id}" value="absent" ${student.status === 'absent' ? 'checked' : ''}>
                                Absent
                            </label>
                            <label>
                                <input type="radio" name="attendance-${student.id}" value="late" ${student.status === 'late' ? 'checked' : ''}>
                                Late
                            </label>
                        </div>
                    `;
                    attendanceList.appendChild(studentItem);
                });
                
                saveAttendanceBtn.disabled = false;
            })
            .catch(error => {
                console.error('Error loading student list:', error);
                attendanceList.innerHTML = '<p>Error loading students. Please try again.</p>';
                saveAttendanceBtn.disabled = true;
            });
        }
        
        function saveAttendance() {
            const classId = classSelect.value;
            const date = dateSelect.value;
            const attendanceData = [];
            
            // Collect all student attendance data
            const studentItems = attendanceList.querySelectorAll('.student-item');
            studentItems.forEach(item => {
                const studentId = item.querySelector('.student-info').textContent.match(/ID: (\w+)/)[1];
                const status = item.querySelector('input[type="radio"]:checked')?.value || 'absent';
                
                attendanceData.push({
                    student_id: studentId,
                    status: status
                });
            });
            
            fetch(`${apiUrl}/attendance/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    class_id: classId,
                    date: date,
                    attendance: attendanceData
                })
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Failed to save attendance');
                }
            })
            .then(data => {
                alert('Attendance saved successfully!');
            })
            .catch(error => {
                console.error('Error saving attendance:', error);
                alert('Error saving attendance. Please try again.');
            });
        }
    }
    
    // Initialize Reports Section
    function initReportsSection() {
        const reportClass = document.getElementById('report-class');
        const reportStudent = document.getElementById('report-student');
        const reportDateFrom = document.getElementById('report-date-from');
        const reportDateTo = document.getElementById('report-date-to');
        const generateReportBtn = document.getElementById('generate-report');
        const reportTable = document.getElementById('report-table').querySelector('tbody');
        
        generateReportBtn.addEventListener('click', generateReport);
        
        function generateReport() {
            const classId = reportClass.value;
            const studentId = reportStudent.value;
            const dateFrom = reportDateFrom.value;
            const dateTo = reportDateTo.value;
            
            if (!dateFrom || !dateTo) {
                alert('Please select date range for the report.');
                return;
            }
            
            let url = `${apiUrl}/reports?from=${dateFrom}&to=${dateTo}`;
            if (classId) url += `&class_id=${classId}`;
            if (studentId) url += `&student_id=${studentId}`;
            
            fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Failed to generate report');
                }
            })
            .then(data => {
                reportTable.innerHTML = '';
                
                if (data.records.length === 0) {
                    reportTable.innerHTML = '<tr><td colspan="4">No attendance records found.</td></tr>';
                    return;
                }
                
                data.records.forEach(record => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${record.date}</td>
                        <td>${record.class_name}</td>
                        <td>${record.student_name}</td>
                        <td class="${record.status}">${record.status}</td>
                    `;
                    reportTable.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error generating report:', error);
                reportTable.innerHTML = '<tr><td colspan="4">Error generating report. Please try again.</td></tr>';
            });
        }
    }
    
    // Initialize Students Section
    function initStudentsSection() {
        const addStudentForm = document.getElementById('add-student-form');
        const filterClass = document.getElementById('filter-class');
        const studentsTable = document.getElementById('students-table').querySelector('tbody');
        
        addStudentForm.addEventListener('submit', addStudent);
        filterClass.addEventListener('change', loadStudentList);
        
        function addStudent(e) {
            e.preventDefault();
            const studentId = document.getElementById('student-id').value;
            const studentName = document.getElementById('student-name').value;
            const studentClass = document.getElementById('student-class').value;
            
            if (!studentId || !studentName || !studentClass) {
                alert('Please fill in all fields.');
                return;
            }
            
            fetch(`${apiUrl}/students/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    id: studentId,
                    name: studentName,
                    class_id: studentClass
                })
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Failed to add student');
                }
            })
            .then(data => {
                alert('Student added successfully!');
                addStudentForm.reset();
                loadStudentList();
            })
            .catch(error => {
                console.error('Error adding student:', error);
                alert('Error adding student. Please try again.');
            });
        }
        
        function loadStudentList() {
            const classId = filterClass.value;
            let url = `${apiUrl}/students`;
            if (classId) url += `?class_id=${classId}`;
            
            fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Failed to load students');
                }
            })
            .then(data => {
                studentsTable.innerHTML = '';
                
                if (data.length === 0) {
                    studentsTable.innerHTML = '<tr><td colspan="4">No students found.</td></tr>';
                    return;
                }
                
                data.forEach(student => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${student.id}</td>
                        <td>${student.name}</td>
                        <td>${student.class_name}</td>
                        <td>
                            <button class="action-btn edit-btn" data-id="${student.id}">Edit</button>
                            <button class="action-btn delete-btn" data-id="${student.id}">Delete</button>
                        </td>
                    `;
                    studentsTable.appendChild(row);
                });
                
                // Add event listeners to the buttons
                studentsTable.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => editStudent(btn.dataset.id));
                });
                
                studentsTable.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', () => deleteStudent(btn.dataset.id));
                });
            })
            .catch(error => {
                console.error('Error loading students:', error);
                studentsTable.innerHTML = '<tr><td colspan="4">Error loading students. Please try again.</td></tr>';
            });
        }
        
        function editStudent(studentId) {
            // Get student data
            fetch(`${apiUrl}/students/${studentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Failed to get student data');
                }
            })
            .then(student => {
                // Populate form for editing
                document.getElementById('student-id').value = student.id;
                document.getElementById('student-id').readOnly = true; // Can't change ID
                document.getElementById('student-name').value = student.name;
                document.getElementById('student-class').value = student.class_id;
                
                // Change the form submission behavior
                addStudentForm.removeEventListener('submit', addStudent);
                
                // Define updateHandler function
                function updateHandler(e) {
                    e.preventDefault();
                    
                    const updatedName = document.getElementById('student-name').value;
                    const updatedClass = document.getElementById('student-class').value;
                    
                    fetch(`${apiUrl}/students/update/${studentId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            name: updatedName,
                            class_id: updatedClass
                        })
                    })
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            throw new Error('Failed to update student');
                        }
                    })
                    .then(data => {
                        alert('Student updated successfully!');
                        // Reset form and event listeners
                        document.getElementById('student-id').readOnly = false;
                        addStudentForm.reset();
                        addStudentForm.removeEventListener('submit', updateHandler);
                        addStudentForm.addEventListener('submit', addStudent);
                        loadStudentList();
                    })
                    .catch(error => {
                        console.error('Error updating student:', error);
                        alert('Error updating student. Please try again.');
                    });
                }
                
                // Add the updateHandler
                addStudentForm.addEventListener('submit', updateHandler);
            })
            .catch(error => {
                console.error('Error getting student data:', error);
                alert('Error retrieving student data. Please try again.');
            });
        }
        
        function deleteStudent(studentId) {
            if (confirm('Are you sure you want to delete this student?')) {
                fetch(`${apiUrl}/students/delete/${studentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error('Failed to delete student');
                    }
                })
                .then(data => {
                    alert('Student deleted successfully!');
                    loadStudentList();
                })
                .catch(error => {
                    console.error('Error deleting student:', error);
                    alert('Error deleting student. Please try again.');
                });
            }
        }
    }
});