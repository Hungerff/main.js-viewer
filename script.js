let file1SVGs = new Set();
let file2SVGs = new Set();
let comparisonMode = false;
let showChangedOnly = false;

// Initialize UI elements
const toggleButton = document.getElementById('toggleCompare');
const toggleChangedButton = document.getElementById('toggleChanged');
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
    if (file1SVGs.size > 0) {
        createGallery(file1SVGs, 'gallery1', file2SVGs);
    }
    if (file2SVGs.size > 0) {
        createGallery(file2SVGs, 'gallery2', file1SVGs);
    }
});

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

function extractSVGs(content) {
    const svgRegex = /['"](.*?\.svg)['"]/g;
    const matches = Array.from(content.matchAll(svgRegex));
    const svgs = new Set();

    matches.forEach(match => {
        const fullPath = match[1];
        if (fullPath.endsWith('.svg')) {
            const fileName = fullPath.split('/').pop();
            svgs.add(fileName);
        }
    });

    return svgs;
}

function updateDiffSummary() {
    if (!comparisonMode || file1SVGs.size === 0 || file2SVGs.size === 0) return;

    const added = new Set([...file2SVGs].filter(x => !file1SVGs.has(x)));
    const removed = new Set([...file1SVGs].filter(x => !file2SVGs.has(x)));
    const unchanged = new Set([...file1SVGs].filter(x => file2SVGs.has(x)));

    diffSummary.innerHTML = `
        <div class="diff-stat unchanged-stat">Unchanged: ${unchanged.size}</div>
        <div class="diff-stat added-stat">Added: ${added.size}</div>
        <div class="diff-stat removed-stat">Removed: ${removed.size}</div>
    `;
}

function createGallery(svgs, galleryId, otherSvgs) {
    const gallery = document.getElementById(galleryId);
    const header = gallery.querySelector('.gallery-header');
    gallery.innerHTML = '';
    gallery.appendChild(header);

    const count = gallery.querySelector('span');
    count.textContent = `${svgs.size} SVGs`;

    svgs.forEach(fileName => {
        const fullPath = `https://tankionline.com/play/static/images/${fileName}`;
        const container = document.createElement('div');
        container.className = 'image-container';

        let isChanged = false;
        if (comparisonMode && otherSvgs) {
            if (!otherSvgs.has(fileName)) {
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
        gallery.appendChild(container);
    });
}

function processFile(file, statusElement) {
    if (!file) return;

    statusElement.textContent = 'Processing file...';
    const reader = new FileReader();

    reader.onload = function(e) {
        const content = e.target.result;
        const svgs = extractSVGs(content);

        if (statusElement.id === 'status1') {
            file1SVGs = svgs;
            createGallery(svgs, 'gallery1', file2SVGs);
        } else {
            file2SVGs = svgs;
            createGallery(svgs, 'gallery2', file1SVGs);
        }

        statusElement.textContent = `Processed ${svgs.size} SVG files`;

        if (comparisonMode) {
            updateDiffSummary();
            if (statusElement.id === 'status1' && file2SVGs.size > 0) {
                createGallery(file2SVGs, 'gallery2', file1SVGs);
            } else if (statusElement.id === 'status2' && file1SVGs.size > 0) {
                createGallery(file1SVGs, 'gallery1', file2SVGs);
            }
        }
    };

    reader.readAsText(file);
}

setupDropZone('dropZone1', 'fileInput1', 'status1', processFile);
setupDropZone('dropZone2', 'fileInput2', 'status2', processFile);