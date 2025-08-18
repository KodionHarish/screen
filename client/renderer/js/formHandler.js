// formHandler.js

const form = document.getElementById('registerForm');
const errorBox = document.getElementById('registerError');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    errorBox.textContent = '';

    const errors = validateRegisterForm(data);
    if (errors.length > 0) {
      errorBox.textContent = errors.join(', ');
      return;
    }

    try {
      // const result = await postData('http://127.0.0.1:5000/api/users/register', data);
      // const result = await postData('http://127.0.0.1:5000/api/auth/register', data);
      const result = await fetch("https://screen-tracker-backend-production.up.railway.app/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      alert('Registration successful!');
      console.log(result,"fdfsf");
      
      window.location.href = 'login.html';
      form.reset();
    } catch (err) {
      console.error('Registration error:', err.message);
      errorBox.textContent = err.message;
    }
  });
}

function validateRegisterForm({ name, email, designation, company, password }) {
  const errors = [];

  if (!name || !email || !designation || !company || !password) {
    errors.push('All fields are required');
  }

  if (email && !validateEmail(email)) {
    errors.push('Invalid email format');
  }

  if (password && password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  return errors;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


// // formHandler.js
// import { postData } from './api.js';

// const { ipcRenderer } = require('electron');
// const form = document.getElementById('registerForm');
// const errorBox = document.getElementById('registerError');

// if (form) {
//   form.addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const data = Object.fromEntries(new FormData(form).entries());
//     errorBox.textContent = ''; // Clear previous errors

//     const errors = validateRegisterForm(data);
//     if (errors.length > 0) {
//       errorBox.textContent = errors.join(', ');
//       return;
//     }

//     try {
//       // const result = await postData('http://127.0.0.1:5000/api/users/register', data);
//       const result = await postData('http://127.0.0.1:5000/api/auth/register', data);
//       // alert('Registration successful!');
//       console.log(result);
//       ipcRenderer.send('navigate-to', 'renderer/login.html');
//       // window.location.href = 'login.html';
//       form.reset();
//     } catch (err) {
//       console.error('Registration error:', err.message);
//       errorBox.textContent = err.message;
//     }
//   });
// }

// function validateRegisterForm({ name, email, designation, company, password }) {
//   const errors = [];

//   if (!name || !email || !designation || !company || !password) {
//     errors.push('All fields are required');
//   }

//   if (email && !validateEmail(email)) {
//     errors.push('Invalid email format');
//   }

//   if (password && password.length < 6) {
//     errors.push('Password must be at least 6 characters');
//   }

//   return errors;
// }

// function validateEmail(email) {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// }
