document.addEventListener('DOMContentLoaded', function() {
    // Get the login button and input elements
    const loginButton = document.querySelector('.login-box button');
    const usernameInput = document.querySelector('.login-box input[type="text"]');
    const passwordInput = document.querySelector('.login-box input[type="password"]');
    
    // Add click event listener to the login button
    loginButton.addEventListener('click', function() {
        // Get the values from the input fields
        const username = usernameInput.value;
        const password = passwordInput.value;
        
        // Create a data object
        const loginData = {
            username: username,
            password: password,
            timestamp: new Date().toISOString()
        };
        
        // Log the data to the console
        console.log('Login attempt:', loginData);
        
        // Optional: Clear the form fields after submission
        usernameInput.value = '';
        passwordInput.value = '';
        
        // Show a simple alert to indicate submission (can be removed in production)
        alert('Login data has been stored in console!');
    });
    
    // Add enter key event listener for the password field
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginButton.click();
        }
    });
});