document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggle ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.className = savedTheme;
    } else {
        // System preference default check
        const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
        if (prefersLight) {
            body.className = 'light-theme';
        } else {
            body.className = 'dark-theme';
        }
    }

    themeToggleBtn.addEventListener('click', () => {
        if (body.classList.contains('dark-theme')) {
            body.className = 'light-theme';
            localStorage.setItem('theme', 'light-theme');
        } else {
            body.className = 'dark-theme';
            localStorage.setItem('theme', 'dark-theme');
        }
    });


    // --- Mobile Navigation Menu ---
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    const toggleMenu = () => {
        hamburger.classList.toggle('open');
        navMenu.classList.toggle('open');
    };

    const closeMenu = () => {
        hamburger.classList.remove('open');
        navMenu.classList.remove('open');
    };

    hamburger.addEventListener('click', toggleMenu);

    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!hamburger.contains(event.target) && !navMenu.contains(event.target)) {
            closeMenu();
        }
    });


    // --- Active Link Highlighting on Scroll ---
    const sections = document.querySelectorAll('section');
    
    const highlightActiveLink = () => {
        let scrollY = window.pageYOffset;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            // Subtract offset to trigger earlier when scrolling down
            const sectionTop = section.offsetTop - 120;
            const sectionId = section.getAttribute('id');
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelector(`.nav-menu a[href*=${sectionId}]`)?.classList.add('active');
            } else {
                document.querySelector(`.nav-menu a[href*=${sectionId}]`)?.classList.remove('active');
            }
        });
    };

    window.addEventListener('scroll', highlightActiveLink);
    highlightActiveLink(); // Trigger once on load


    // --- Contact Form Submission Simulation ---
    const contactForm = document.getElementById('contact-form');
    const formFeedback = document.getElementById('form-feedback');
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const submitBtnText = submitBtn.querySelector('span');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get inputs values
        const nameVal = document.getElementById('name').value.trim();
        const emailVal = document.getElementById('email').value.trim();
        const subjectVal = document.getElementById('subject').value.trim();
        const messageVal = document.getElementById('message').value.trim();

        if (!nameVal || !emailVal || !subjectVal || !messageVal) {
            showFeedback('Please fill out all fields.', 'error');
            return;
        }

        // Disable button & show loading state
        submitBtn.disabled = true;
        const originalText = submitBtnText.textContent;
        submitBtnText.textContent = 'Sending Message...';

        // Simulate API network request delay
        setTimeout(() => {
            // Re-enable button & restore state
            submitBtn.disabled = false;
            submitBtnText.textContent = originalText;

            // Show success feedback
            showFeedback(`Thank you, ${nameVal}! Your message has been sent successfully. Albert will be in touch shortly.`, 'success');
            
            // Reset form
            contactForm.reset();
        }, 1500);
    });

    const showFeedback = (message, type) => {
        formFeedback.textContent = message;
        formFeedback.className = `form-feedback ${type}`;
        
        // Auto-hide feedback after 7 seconds
        setTimeout(() => {
            formFeedback.classList.add('hidden');
        }, 7000);
    };
});
