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

// ==========================================
// Electric Storm Background Animation
// ==========================================
(function () {
    const canvas = document.getElementById('storm-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    const lightningBolts = [];
    const ambientArcs = [];
    let flashOpacity = 0;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // --- Color helpers based on theme ---
    function isDark() {
        return document.body.classList.contains('dark-theme');
    }

    function stormColors() {
        if (isDark()) {
            return {
                bolt: 'rgba(140, 160, 255, ALPHA)',
                glow: 'rgba(100, 120, 255, ALPHA)',
                flash: 'rgba(180, 200, 255, ALPHA)',
                arc: 'rgba(120, 140, 255, ALPHA)',
                ambient: 'rgba(60, 80, 180, 0.03)',
            };
        } else {
            return {
                bolt: 'rgba(80, 80, 140, ALPHA)',
                glow: 'rgba(70, 70, 130, ALPHA)',
                flash: 'rgba(100, 100, 160, ALPHA)',
                arc: 'rgba(90, 90, 150, ALPHA)',
                ambient: 'rgba(100, 100, 180, 0.02)',
            };
        }
    }

    function colorWithAlpha(template, alpha) {
        return template.replace('ALPHA', alpha.toFixed(3));
    }

    // --- Lightning Bolt ---
    class LightningBolt {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = 0;
            this.segments = [];
            this.life = 1.0;
            this.decay = 0.02 + Math.random() * 0.03;
            this.thickness = 1.5 + Math.random() * 2;
            this.branches = [];
            this.generatePath();
        }

        generatePath() {
            let x = this.x;
            let y = this.y;
            const targetY = height * (0.3 + Math.random() * 0.7);
            const segLength = 8 + Math.random() * 12;

            while (y < targetY) {
                const newX = x + (Math.random() - 0.5) * 60;
                const newY = y + segLength + Math.random() * segLength;
                this.segments.push({ x1: x, y1: y, x2: newX, y2: newY });

                // Random branching
                if (Math.random() < 0.25 && this.branches.length < 4) {
                    this.branches.push(this.generateBranch(newX, newY, 3 + Math.floor(Math.random() * 5)));
                }

                x = newX;
                y = newY;
            }
        }

        generateBranch(startX, startY, numSegs) {
            const segs = [];
            let x = startX;
            let y = startY;
            const dir = Math.random() < 0.5 ? -1 : 1;
            for (let i = 0; i < numSegs; i++) {
                const newX = x + dir * (10 + Math.random() * 30);
                const newY = y + 8 + Math.random() * 15;
                segs.push({ x1: x, y1: y, x2: newX, y2: newY });
                x = newX;
                y = newY;
            }
            return segs;
        }

        update() {
            this.life -= this.decay;
        }

        draw() {
            if (this.life <= 0) return;
            const colors = stormColors();
            const alpha = this.life;

            // Main glow
            ctx.save();
            ctx.shadowBlur = 30 * alpha;
            ctx.shadowColor = colorWithAlpha(colors.glow, alpha * 0.6);
            ctx.strokeStyle = colorWithAlpha(colors.bolt, alpha * 0.9);
            ctx.lineWidth = this.thickness * alpha;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            for (const seg of this.segments) {
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
            }
            ctx.stroke();

            // Branches (thinner)
            ctx.lineWidth = (this.thickness * 0.5) * alpha;
            ctx.shadowBlur = 15 * alpha;
            for (const branch of this.branches) {
                ctx.beginPath();
                for (const seg of branch) {
                    ctx.moveTo(seg.x1, seg.y1);
                    ctx.lineTo(seg.x2, seg.y2);
                }
                ctx.stroke();
            }

            // Bright core
            ctx.shadowBlur = 0;
            ctx.strokeStyle = colorWithAlpha(colors.flash, alpha * 0.5);
            ctx.lineWidth = Math.max(0.5, (this.thickness * 0.3) * alpha);
            ctx.beginPath();
            for (const seg of this.segments) {
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
            }
            ctx.stroke();
            ctx.restore();
        }

        isDead() {
            return this.life <= 0;
        }
    }

    // --- Ambient Electric Arc (crawling subtle arcs) ---
    class AmbientArc {
        constructor() {
            this.reset();
        }

        reset() {
            // Pick a random edge to start from
            const edge = Math.floor(Math.random() * 4);
            if (edge === 0) { this.x = Math.random() * width; this.y = 0; }
            else if (edge === 1) { this.x = width; this.y = Math.random() * height; }
            else if (edge === 2) { this.x = Math.random() * width; this.y = height; }
            else { this.x = 0; this.y = Math.random() * height; }

            this.points = [{ x: this.x, y: this.y }];
            this.life = 1.0;
            this.decay = 0.008 + Math.random() * 0.012;
            this.length = 5 + Math.floor(Math.random() * 15);

            // Generate a wiggly path
            let cx = this.x, cy = this.y;
            for (let i = 0; i < this.length; i++) {
                cx += (Math.random() - 0.5) * 80;
                cy += (Math.random() - 0.5) * 80;
                cx = Math.max(0, Math.min(width, cx));
                cy = Math.max(0, Math.min(height, cy));
                this.points.push({ x: cx, y: cy });
            }
        }

        update() {
            this.life -= this.decay;
        }

        draw() {
            if (this.life <= 0 || this.points.length < 2) return;
            const colors = stormColors();
            const alpha = this.life * 0.3;

            ctx.save();
            ctx.strokeStyle = colorWithAlpha(colors.arc, alpha);
            ctx.lineWidth = 0.5 + this.life;
            ctx.shadowBlur = 8 * this.life;
            ctx.shadowColor = colorWithAlpha(colors.glow, alpha * 0.4);
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.stroke();
            ctx.restore();
        }

        isDead() {
            return this.life <= 0;
        }
    }

    // --- Animation Timing ---
    let nextBoltTime = 0;
    let nextArcTime = 0;

    function spawnBolt(now) {
        if (now > nextBoltTime) {
            lightningBolts.push(new LightningBolt());
            flashOpacity = 0.08 + Math.random() * 0.06;
            // Random interval: 1.5s to 5s between major bolts
            nextBoltTime = now + 1500 + Math.random() * 3500;

            // Occasionally double-strike
            if (Math.random() < 0.3) {
                setTimeout(() => {
                    lightningBolts.push(new LightningBolt());
                    flashOpacity = Math.min(flashOpacity + 0.04, 0.15);
                }, 80 + Math.random() * 120);
            }
        }
    }

    function spawnArc(now) {
        if (now > nextArcTime) {
            ambientArcs.push(new AmbientArc());
            nextArcTime = now + 300 + Math.random() * 700;
        }
    }

    // --- Main Animation Loop ---
    function animate(timestamp) {
        ctx.clearRect(0, 0, width, height);

        // Subtle atmospheric gradient overlay
        const colors = stormColors();
        const grad = ctx.createRadialGradient(width / 2, 0, 0, width / 2, 0, height);
        grad.addColorStop(0, colors.ambient);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Flash effect (screen illumination from lightning)
        if (flashOpacity > 0) {
            ctx.fillStyle = colorWithAlpha(colors.flash, flashOpacity);
            ctx.fillRect(0, 0, width, height);
            flashOpacity *= 0.92;
            if (flashOpacity < 0.005) flashOpacity = 0;
        }

        // Spawn new elements
        spawnBolt(timestamp);
        spawnArc(timestamp);

        // Update and draw ambient arcs
        for (let i = ambientArcs.length - 1; i >= 0; i--) {
            ambientArcs[i].update();
            ambientArcs[i].draw();
            if (ambientArcs[i].isDead()) ambientArcs.splice(i, 1);
        }

        // Update and draw lightning bolts
        for (let i = lightningBolts.length - 1; i >= 0; i--) {
            lightningBolts[i].update();
            lightningBolts[i].draw();
            if (lightningBolts[i].isDead()) lightningBolts.splice(i, 1);
        }

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
})();
