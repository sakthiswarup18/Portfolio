// Dark Mode Toggle
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
  document.body.classList.add('dark');
  themeToggle.textContent = '☼';
} else {
  themeToggle.textContent = '☾';
}
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  if (document.body.classList.contains('dark')) {
    themeToggle.textContent = '☼';
    localStorage.setItem('theme', 'dark');
  } else {
    themeToggle.textContent = '☾';
    localStorage.setItem('theme', 'light');
  }
});

// Mobile Navigation Toggle
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.querySelector('.nav');
navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('open');
});

// Section Reveal on Scroll using Intersection Observer
const sections = document.querySelectorAll('section');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });
sections.forEach(section => observer.observe(section));

// Back-to-Top Button Functionality using class toggling
const backToTopButton = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  if (window.pageYOffset > 100) {
    backToTopButton.classList.add('visible');
  } else {
    backToTopButton.classList.remove('visible');
  }
});
backToTopButton.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Interactive Project Filters
const filterButtons = document.querySelectorAll('.filter-btn');
const projectItems = document.querySelectorAll('.project-item');
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active class from all buttons
    filterButtons.forEach(button => button.classList.remove('active'));
    // Add active class to clicked button
    btn.classList.add('active');
    const filterValue = btn.getAttribute('data-filter');
    projectItems.forEach(item => {
      if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  });
});

// Contact Modal Functionality
const contactLink = document.querySelector('.contact-link');
const contactModal = document.getElementById('contact-modal');
const closeButton = document.querySelector('.close-button');
contactLink.addEventListener('click', (e) => {
  e.preventDefault();
  contactModal.classList.add('visible');
});
closeButton.addEventListener('click', () => {
  contactModal.classList.remove('visible');
});
window.addEventListener('click', (e) => {
  if (e.target === contactModal) {
    contactModal.classList.remove('visible');
  }
});
