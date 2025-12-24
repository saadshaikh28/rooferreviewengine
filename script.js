/**
 * GOOGLE REVIEW ENGINE PRO
 * - GSAP Animations
 * - 3D Background (Three.js)
 * - Intelligent Review Generator
 */

// --- CONFIGURATION ---

let rooferConfig = {
    name: "Roofer",
    companyName: "Roofing Experts",
    city: "Austin",
    serviceArea: "Texas",
    googleReviewLink: "#"
};

// State Object
let state = {
    step: 1,
    service: '',
    city: '',
    professionalism: 'Outstanding',
    communication: 'Crystal Clear',
    timeliness: 'Record Time',
    additionalComments: '',
    generatedReview: ''
};

const labels = {
    professionalism: ["Okay", "Great", "Outstanding"],
    communication: ["Vague", "Good", "Crystal Clear"],
    timeliness: ["On Time", "Quickly", "Record Time"]
};

// --- DOM ELEMENTS ---
const progressBar = document.getElementById('progressBar');
const dots = document.querySelectorAll('.step-dot');
const steps = document.querySelectorAll('.wizard-step');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    loadRooferConfig();
    initThreeJS();
    initGSAP();
    initEventListeners();
    updateUI(false);
});

function loadRooferConfig() {
    const hostname = window.location.hostname;
    const urlParams = new URLSearchParams(window.location.search);
    let clientName = urlParams.get('config');
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || !hostname.includes('.');

    if (!clientName && !isLocal) {
        const parts = hostname.split('.');
        if (parts.length > 2) clientName = parts[0];
    }

    if (!clientName || isLocal) {
        clientName = clientName || 'default';
    }

    const configFile = `configs/${clientName}.json`;

    fetch(configFile)
        .then(response => response.json())
        .then(config => {
            rooferConfig = { ...rooferConfig, ...config };

            // Personalization
            const displayName = rooferConfig.companyName || rooferConfig.name;
            document.title = `${displayName} - Leave a Review`;

            // Update Hero Title
            const titleCompany = document.getElementById('titleCompanyName');
            if (titleCompany) {
                titleCompany.innerText = displayName;
                gsap.from(titleCompany, { opacity: 0, y: 20, duration: 1, delay: 0.5 });
            }

            const cityInput = document.getElementById('cityInput');
            if (cityInput && rooferConfig.city) {
                cityInput.value = rooferConfig.city;
                state.city = rooferConfig.city;
            }

            const googleMapsBtn = document.getElementById('googleMapsBtn');
            if (googleMapsBtn && rooferConfig.googleReviewLink) {
                googleMapsBtn.href = rooferConfig.googleReviewLink;
            }
        })
        .catch(err => console.error("Config load error:", err));
}

// --- 3D BACKGROUND (Three.js) ---
function initThreeJS() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
    const material = new THREE.MeshBasicMaterial({
        color: 0xFACC15,
        wireframe: true,
        transparent: true,
        opacity: 0.05
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    camera.position.z = 15;

    function animate() {
        requestAnimationFrame(animate);
        sphere.rotation.x += 0.001;
        sphere.rotation.y += 0.001;
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// --- GSAP ANIMATIONS ---
function initGSAP() {
    gsap.from(".hero-title .line", {
        y: 100,
        opacity: 0,
        duration: 1,
        ease: "power4.out"
    });
}

// --- EVENT LISTENERS ---
function initEventListeners() {
    // Service selection
    document.querySelectorAll('.shape-option[data-group="service"]').forEach(opt => {
        opt.addEventListener('click', () => {
            state.service = opt.dataset.value;
            document.querySelectorAll('.shape-option[data-group="service"]').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            gsap.fromTo(opt, { scale: 0.95 }, { scale: 1, duration: 0.3 });
        });
    });

    // City input
    document.getElementById('cityInput').addEventListener('input', (e) => {
        state.city = e.target.value;
        document.getElementById('cityBadge').classList.add('hidden');
    });

    // Confirm City
    document.getElementById('confirmCityBtn').addEventListener('click', () => {
        const badge = document.getElementById('cityBadge');
        badge.innerHTML = "✅ Confirmed";
        badge.style.background = "#10b981";
        badge.style.color = "#fff";
        setTimeout(() => {
            badge.classList.add('hidden');
            if (state.service) nextStep();
        }, 800);
    });

    // Sliders
    const sliders = ['professionalism', 'communication', 'time'];
    sliders.forEach(id => {
        const slider = document.getElementById(`${id}Slider`);
        const display = document.getElementById(`${id}Display`);
        if (slider) {
            slider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                const label = labels[id === 'time' ? 'timeliness' : id][val - 1];
                state[id === 'time' ? 'timeliness' : id] = label;
                display.innerText = label;
                updateSliderFill(slider);
            });
            updateSliderFill(slider);
        }
    });

    // Nav
    document.querySelectorAll('.next-btn').forEach(btn => {
        btn.addEventListener('click', () => nextStep());
    });

    document.querySelectorAll('.prev-btn').forEach(btn => {
        btn.addEventListener('click', () => prevStep());
    });

    // Copy Button
    document.getElementById('copyBtn').addEventListener('click', () => {
        navigator.clipboard.writeText(state.generatedReview);
        const btn = document.getElementById('copyBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = "✅ Copied!";
        btn.style.background = "#10b981";
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = "";
        }, 2000);
    });
}

function updateSliderFill(slider) {
    const percent = (slider.value - slider.min) * 100 / (slider.max - slider.min);
    slider.style.setProperty('--range-percent', percent + '%');
}

function nextStep() {
    if (validateStep(state.step)) {
        if (state.step < 4) {
            state.step++;
            updateUI(true);
        }
        if (state.step === 4) {
            generateReview();
        }
    } else {
        gsap.to(`.wizard-step[data-step="${state.step}"]`, { x: 10, duration: 0.1, yoyo: true, repeat: 5 });
    }
}

function prevStep() {
    if (state.step > 1) {
        state.step--;
        updateUI(true);
    }
}

function validateStep(step) {
    if (step === 1) return state.service !== '' && state.city !== '';
    return true;
}

function updateUI(shouldScroll = false) {
    if (shouldScroll) {
        document.getElementById('review-engine').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const progress = ((state.step - 1) / 3) * 100;
    if (progressBar) progressBar.style.width = `${progress}%`;

    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx + 1 === state.step);
        dot.classList.toggle('completed', idx + 1 < state.step);
    });

    steps.forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.step) === state.step);
        if (s.classList.contains('active')) {
            gsap.fromTo(s, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 });
        }
    });
}

function generateReview() {
    const service = state.service;
    const city = state.city;
    const prof = state.professionalism;
    const comm = state.communication;
    const time = state.timeliness;
    const extra = document.getElementById('additionalComments').value;

    const intros = [
        `We had our ${service} done in ${city} and the crew was ${prof.toLowerCase()} from start to finish.`,
        `Amazing experience getting our ${service} in ${city}. The team was extremely ${prof.toLowerCase()}.`,
        `If you need a ${service} in ${city}, look no further. This crew is ${prof.toLowerCase()}!`
    ];

    const bodies = [
        `Communication was ${comm.toLowerCase()} and they finished the job in ${time.toLowerCase()}.`,
        `They were ${comm.toLowerCase()} throughout the process. The work was completed ${time.toLowerCase()}.`,
        `I really appreciated how ${comm.toLowerCase()} they were. Plus, they finished in ${time.toLowerCase()}!`
    ];

    const closings = [
        `I’d absolutely recommend them to anyone in ${city}!`,
        `Highly recommend their services!`,
        `Great job all around, definitely worth calling for your next roofing project.`
    ];

    // Pick random structures
    const intro = intros[Math.floor(Math.random() * intros.length)];
    const body = bodies[Math.floor(Math.random() * bodies.length)];
    const closing = closings[Math.floor(Math.random() * closings.length)];

    let finalReview = `${intro} ${body} ${extra ? extra + ' ' : ''}${closing}`;

    state.generatedReview = finalReview;
    document.getElementById('reviewText').innerText = finalReview;
}
