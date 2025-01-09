let file1SVGs = new Set();
let file2SVGs = new Set();
let file1WebPs = new Set();
let file2WebPs = new Set();
let comparisonMode = false;
let showChangedOnly = false;
let currentViewType = 'all'; // Can be 'all', 'svg', or 'webp'

// Initialize UI elements
const toggleButton = document.getElementById('toggleCompare');
const toggleChangedButton = document.getElementById('toggleChanged');
const toggleSVG = document.getElementById('toggleSVG');
const toggleWebP = document.getElementById('toggleWebP');
const toggleAll = document.getElementById('toggleAll');
const fileInputsContainer = document.querySelector('.file-inputs');
const galleriesContainer = document.querySelector('.galleries');
const secondaryFileInput = document.getElementById('dropZone2');
const secondaryGallery = document.getElementById('gallery2');
const diffSummary = document.getElementById('diffSummary');

// Toggle comparison mode
toggleButton.addEventListener('click', () => {
    comparisonMode = !comparisonMode;
    toggleButton.textContent = comparisonMode ? 'Disable Comparison Mode' : 'Enable Comparison Mode';
    fileInputsContainer.classList.toggle('comparison-mode', comparisonMode);
    galleriesContainer.classList.toggle('comparison-mode', comparisonMode);
    secondaryFileInput.classList.toggle('hidden', !comparisonMode);
    secondaryGallery.classList.toggle('hidden', !comparisonMode);
    diffSummary.classList.toggle('hidden', !comparisonMode);
    toggleChangedButton.classList.toggle('hidden', !comparisonMode);
});

// Toggle show changed only
toggleChangedButton.addEventListener('click', () => {
    showChangedOnly = !showChangedOnly;
    toggleChangedButton.textContent = showChangedOnly ? 'Show All' : 'Only Show Changes';

    // Refresh galleries to apply the filter
    if (file1SVGs.size > 0 || file1WebPs.size > 0) {
        createGallery('gallery1', file1SVGs, file1WebPs, file2SVGs, file2WebPs);
    }
    if (file2SVGs.size > 0 || file2WebPs.size > 0) {
        createGallery('gallery2', file2SVGs, file2WebPs, file1SVGs, file1WebPs);
    }
});

// Type toggle handlers
toggleSVG.addEventListener('click', () => setViewType('svg'));
toggleWebP.addEventListener('click', () => setViewType('webp'));
toggleAll.addEventListener('click', () => setViewType('all'));

function setViewType(type) {
    currentViewType = type;

    // Update button states
    [toggleSVG, toggleWebP, toggleAll].forEach(button => {
        button.classList.remove('active');
    });

    switch(type) {
        case 'svg':
            toggleSVG.classList.add('active');
            break;
        case 'webp':
            toggleWebP.classList.add('active');
            break;
        case 'all':
            toggleAll.classList.add('active');
            break;
    }

    // Update visibility of sections
    const svgSections = document.querySelectorAll('.svg-section');
    const webpSections = document.querySelectorAll('.webp-section');

    svgSections.forEach(section => {
        section.classList.toggle('hidden-type', type === 'webp');
    });

    webpSections.forEach(section => {
        section.classList.toggle('hidden-type', type === 'svg');
    });
}

function setupDropZone(dropZoneId, fileInputId, statusId, processFile) {
    const dropZone = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(fileInputId);
    const status = document.getElementById(statusId);

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => highlight(dropZone), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => unhighlight(dropZone), false);
    });

    dropZone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        processFile(file, status);
    });

    fileInput.addEventListener('change', (e) => {
        processFile(e.target.files[0], status);
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(element) {
    element.classList.add('drop-zone');
}

function unhighlight(element) {
    element.classList.remove('drop-zone');
}

function extractImages(content) {
    const svgRegex = /['"](.*?\.svg)['"]/g;
    const webpRegex = /['"](.*?\.webp)['"]/g;
    const svgMatches = Array.from(content.matchAll(svgRegex));
    const webpMatches = Array.from(content.matchAll(webpRegex));

    const svgs = new Set();
    const webps = new Set();

    svgMatches.forEach(match => {
        const fullPath = match[1];
        if (fullPath.endsWith('.svg')) {
            const fileName = fullPath.split('/').pop();
            svgs.add(fileName);
        }
    });

    webpMatches.forEach(match => {
        const fullPath = match[1];
        if (fullPath.endsWith('.webp')) {
            const fileName = fullPath.split('/').pop();
            webps.add(fileName);
        }
    });

    return { svgs, webps };
}

function updateDiffSummary() {
    if (!comparisonMode) return;

    const addedSVGs = new Set([...file2SVGs].filter(x => !file1SVGs.has(x)));
    const removedSVGs = new Set([...file1SVGs].filter(x => !file2SVGs.has(x)));
    const unchangedSVGs = new Set([...file1SVGs].filter(x => file2SVGs.has(x)));

    const addedWebPs = new Set([...file2WebPs].filter(x => !file1WebPs.has(x)));
    const removedWebPs = new Set([...file1WebPs].filter(x => !file2WebPs.has(x)));
    const unchangedWebPs = new Set([...file1WebPs].filter(x => file2WebPs.has(x)));

    diffSummary.innerHTML = `
        <div class="file-type-summary">
            <h3>SVG Files:</h3>
            <div class="diff-stat unchanged-stat">Unchanged: ${unchangedSVGs.size}</div>
            <div class="diff-stat added-stat">Added: ${addedSVGs.size}</div>
            <div class="diff-stat removed-stat">Removed: ${removedSVGs.size}</div>
        </div>
        <div class="file-type-summary">
            <h3>WebP Files:</h3>
            <div class="diff-stat unchanged-stat">Unchanged: ${unchangedWebPs.size}</div>
            <div class="diff-stat added-stat">Added: ${addedWebPs.size}</div>
            <div class="diff-stat removed-stat">Removed: ${removedWebPs.size}</div>
        </div>
    `;
}

function createImageSection(container, images, otherImages, galleryId, fileType) {
    const section = document.createElement('div');
    section.className = `section ${fileType.toLowerCase()}-section`;

    const header = document.createElement('h3');
    header.textContent = `${fileType} Files (${images.size})`;
    section.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'image-grid';

    images.forEach(fileName => {
        const fullPath = `https://tankionline.com/play/static/images/${fileName}`;
        const container = document.createElement('div');
        container.className = 'image-container';

        let isChanged = false;
        if (comparisonMode && otherImages) {
            if (!otherImages.has(fileName)) {
                container.classList.add(galleryId === 'gallery2' ? 'added' : 'removed');
                isChanged = true;
            }
        }

        // Skip unchanged items if showChangedOnly is true
        if (showChangedOnly && comparisonMode && !isChanged) {
            return;
        }

        const img = document.createElement('img');
        img.src = fullPath;
        img.alt = fileName;
        img.loading = 'lazy';

        img.onerror = () => {
            container.style.display = 'none';
        };

        const name = document.createElement('div');
        name.className = 'filename';
        name.textContent = fileName;

        container.appendChild(img);
        container.appendChild(name);
        grid.appendChild(container);
    });

    section.appendChild(grid);
    container.appendChild(section);
}

function createGallery(galleryId, svgs, webps, otherSvgs, otherWebps) {
    const gallery = document.getElementById(galleryId);
    const header = gallery.querySelector('.gallery-header');
    gallery.innerHTML = '';
    gallery.appendChild(header);

    const count = gallery.querySelector('span');
    count.textContent = `${svgs.size + webps.size} Files`;

    if (svgs.size > 0) {
        createImageSection(gallery, svgs, otherSvgs, galleryId, 'SVG');
    }

    if (webps.size > 0) {
        createImageSection(gallery, webps, otherWebps, galleryId, 'WebP');
    }

    // Apply current view type
    const svgSections = gallery.querySelectorAll('.svg-section');
    const webpSections = gallery.querySelectorAll('.webp-section');

    svgSections.forEach(section => {
        section.classList.toggle('hidden-type', currentViewType === 'webp');
    });

    webpSections.forEach(section => {
        section.classList.toggle('hidden-type', currentViewType === 'svg');
    });
}

function processFile(file, statusElement) {
    if (!file) return;

    statusElement.textContent = 'Processing file...';
    const reader = new FileReader();

    reader.onload = function(e) {
        const content = e.target.result;
        const { svgs, webps } = extractImages(content);

        if (statusElement.id === 'status1') {
            file1SVGs = svgs;
            file1WebPs = webps;
            createGallery('gallery1', svgs, webps, file2SVGs, file2WebPs);
        } else {
            file2SVGs = svgs;
            file2WebPs = webps;
            createGallery('gallery2', svgs, webps, file1SVGs, file1WebPs);
        }

        statusElement.textContent = `Processed ${svgs.size} SVGs and ${webps.size} WebPs`;

        if (comparisonMode) {
            updateDiffSummary();
            if (statusElement.id === 'status1' && (file2SVGs.size > 0 || file2WebPs.size > 0)) {
                createGallery('gallery2', file2SVGs, file2WebPs, file1SVGs, file1WebPs);
            } else if (statusElement.id === 'status2' && (file1SVGs.size > 0 || file1WebPs.size > 0)) {
                createGallery('gallery1', file1SVGs, file1WebPs, file2SVGs, file2WebPs);
            }
        }
    };

    reader.readAsText(file);
}

setupDropZone('dropZone1', 'fileInput1', 'status1', processFile);
setupDropZone('dropZone2', 'fileInput2', 'status2', processFile);