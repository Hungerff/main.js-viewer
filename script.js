let file1SVGs = new Set();
let file2SVGs = new Set();
let file1WebPs = new Set();
let file2WebPs = new Set();
let file1PNGs = new Set();
let file2PNGs = new Set();
let file1MP3s = new Set();
let file2MP3s = new Set();
let file1MP4s = new Set();
let file2MP4s = new Set();
let comparisonMode = false;
let showChangedOnly = false;
let currentViewType = 'all'; // Can be 'all', 'svg', 'webp', 'png', 'mp3', 'mp4'

// Initialize UI elements
const toggleButton = document.getElementById('toggleCompare');
const toggleChangedButton = document.getElementById('toggleChanged');
const toggleSVG = document.getElementById('toggleSVG');
const toggleWebP = document.getElementById('toggleWebP');
const togglePNG = document.getElementById('togglePNG');
const toggleMP3 = document.getElementById('toggleMP3');
const toggleMP4 = document.getElementById('toggleMP4');
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
    if (hasFiles(file1SVGs, file1WebPs, file1PNGs, file1MP3s, file1MP4s)) {
        createGallery('gallery1', file1SVGs, file1WebPs, file1PNGs, file1MP3s, file1MP4s,
                     file2SVGs, file2WebPs, file2PNGs, file2MP3s, file2MP4s);
    }
    if (hasFiles(file2SVGs, file2WebPs, file2PNGs, file2MP3s, file2MP4s)) {
        createGallery('gallery2', file2SVGs, file2WebPs, file2PNGs, file2MP3s, file2MP4s,
                     file1SVGs, file1WebPs, file1PNGs, file1MP3s, file1MP4s);
    }
});

// Type toggle handlers
toggleSVG.addEventListener('click', () => setViewType('svg'));
toggleWebP.addEventListener('click', () => setViewType('webp'));
togglePNG.addEventListener('click', () => setViewType('png'));
toggleMP3.addEventListener('click', () => setViewType('mp3'));
toggleMP4.addEventListener('click', () => setViewType('mp4'));
toggleAll.addEventListener('click', () => setViewType('all'));

function hasFiles(...sets) {
    return sets.some(set => set.size > 0);
}

function setViewType(type) {
    currentViewType = type;

    // Update button states
    [toggleSVG, toggleWebP, togglePNG, toggleMP3, toggleMP4, toggleAll].forEach(button => {
        button.classList.remove('active');
    });

    const button = {
        'svg': toggleSVG,
        'webp': toggleWebP,
        'png': togglePNG,
        'mp3': toggleMP3,
        'mp4': toggleMP4,
        'all': toggleAll
    }[type];

    if (button) button.classList.add('active');

    // Update visibility of sections
    const sections = {
        'svg': document.querySelectorAll('.svg-section'),
        'webp': document.querySelectorAll('.webp-section'),
        'png': document.querySelectorAll('.png-section'),
        'mp3': document.querySelectorAll('.mp3-section'),
        'mp4': document.querySelectorAll('.mp4-section')
    };

    Object.entries(sections).forEach(([sectionType, elements]) => {
        elements.forEach(section => {
            section.classList.toggle('hidden-type', type !== 'all' && type !== sectionType);
        });
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
    const patterns = {
        svg: /['"](.*?\.svg)['"]/g,
        webp: /['"](.*?\.webp)['"]/g,
        png: /['"](.*?\.png)['"]/g,
        mp3: /['"](.*?\.mp3)['"]/g,
        mp4: /['"](.*?\.(mp4|webm))['"]/g // Combine MP4 and WebM
    };

    const results = {
        svgs: new Set(),
        webps: new Set(),
        pngs: new Set(),
        mp3s: new Set(),
        mp4s: new Set() // Store both MP4 and WebM here
    };

    Object.entries(patterns).forEach(([type, regex]) => {
        const matches = Array.from(content.matchAll(regex));
        matches.forEach(match => {
            const fullPath = match[1];
            if (fullPath.endsWith(`.${type}`) || (type === 'mp4' && /\.(mp4|webm)$/.test(fullPath))) {
                const fileName = fullPath.split('/').pop();
                results[`${type}s`].add(fileName);
            }
        });
    });

    return results;
}


function createMediaPreview(fileName, type) {
    let fullPath = `https://tankionline.com/play/static/images/${fileName}`;

    if (type === 'mp4' && fileName.endsWith('.webm')) {
        fullPath = `https://tankionline.com/play/static/videos/${fileName}`;
    }

    if (type === 'mp3') {
        fullPath = `https://tankionline.com/play/static/sound/${fileName}`; // Updated path for MP3
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = fullPath;
        return audio;
    } else if (type === 'mp4') { // Handles both MP4 and WebM
        const video = document.createElement('video');
        video.controls = true;
        video.src = fullPath;
        return video;
    } else {
        const img = document.createElement('img');
        img.src = fullPath;
        img.alt = fileName;
        img.loading = 'lazy';
        return img;
    }
}


function createImageSection(container, files, otherFiles, galleryId, fileType) {
    const section = document.createElement('div');
    section.className = `section ${fileType.toLowerCase()}-section`;

    const header = document.createElement('h3');
    header.textContent = `${fileType} Files (${files.size})`;
    section.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'image-grid';

    files.forEach(fileName => {
        const container = document.createElement('div');
        container.className = 'image-container';

        let isChanged = false;
        if (comparisonMode && otherFiles) {
            if (!otherFiles.has(fileName)) {
                container.classList.add(galleryId === 'gallery2' ? 'added' : 'removed');
                isChanged = true;
            }
        }

        // Debug visibility logic
        if (showChangedOnly && comparisonMode && !isChanged) {
            console.log(`Hiding unchanged file: ${fileName}`);
            return; // Skip unchanged files
        }

        const mediaElement = createMediaPreview(fileName, fileType.toLowerCase());
        mediaElement.onerror = () => {
            console.warn(`Error loading media: ${fileName}`);
            container.style.display = 'none';
        };

        const name = document.createElement('div');
        name.className = 'filename';
        name.textContent = fileName;

        container.appendChild(mediaElement);
        container.appendChild(name);
        grid.appendChild(container);
    });

    section.appendChild(grid);
    container.appendChild(section);
}


function createGallery(galleryId, svgs, webps, pngs, mp3s, mp4s, otherSvgs, otherWebps, otherPngs, otherMp3s, otherMp4s) {
    const gallery = document.getElementById(galleryId);
    const header = gallery.querySelector('.gallery-header');
    gallery.innerHTML = '';
    gallery.appendChild(header);

    const totalFiles = svgs.size + webps.size + pngs.size + mp3s.size + mp4s.size;
    const count = gallery.querySelector('span');
    count.textContent = `${totalFiles} Files`;

    const sections = [
        { files: svgs, otherFiles: otherSvgs, type: 'SVG' },
        { files: webps, otherFiles: otherWebps, type: 'WebP' },
        { files: pngs, otherFiles: otherPngs, type: 'PNG' },
        { files: mp3s, otherFiles: otherMp3s, type: 'MP3' },
        { files: mp4s, otherFiles: otherMp4s, type: 'MP4' } // Includes WebM
    ];

    sections.forEach(({ files, otherFiles, type }) => {
        if (files.size > 0) {
            console.log(`Adding ${files.size} ${type} files to ${galleryId}`);
            createImageSection(gallery, files, otherFiles, galleryId, type);
        }
    });

    // Apply current view type
    setViewType(currentViewType);
}



function processFile(file, statusElement) {
    if (!file) return;

    statusElement.textContent = 'Processing file...';
    const reader = new FileReader();

    reader.onload = function(e) {
        const content = e.target.result;
        const { svgs, webps, pngs, mp3s, mp4s } = extractImages(content);

        if (statusElement.id === 'status1') {
            file1SVGs = svgs;
            file1WebPs = webps;
            file1PNGs = pngs;
            file1MP3s = mp3s;
            file1MP4s = mp4s;
            createGallery('gallery1', svgs, webps, pngs, mp3s, mp4s,
                         file2SVGs, file2WebPs, file2PNGs, file2MP3s, file2MP4s);
        } else {
            file2SVGs = svgs;
            file2WebPs = webps;
            file2PNGs = pngs;
            file2MP3s = mp3s;
            file2MP4s = mp4s;
            createGallery('gallery2', svgs, webps, pngs, mp3s, mp4s,
                         file1SVGs, file1WebPs, file1PNGs, file1MP3s, file1MP4s);
        }

        statusElement.textContent = `Processed ${svgs.size} SVGs, ${webps.size} WebPs, ${pngs.size} PNGs, ${mp3s.size} MP3s, and ${mp4s.size} MP4s`;

        if (comparisonMode) {
            updateDiffSummary();
            if (statusElement.id === 'status1' && hasFiles(file2SVGs, file2WebPs, file2PNGs, file2MP3s, file2MP4s)) {
                createGallery('gallery2', file2SVGs, file2WebPs, file2PNGs, file2MP3s, file2MP4s,
                             file1SVGs, file1WebPs, file1PNGs, file1MP3s, file1MP4s);
            } else if (statusElement.id === 'status2' && hasFiles(file1SVGs, file1WebPs, file1PNGs, file1MP3s, file1MP4s)) {
                createGallery('gallery1', file1SVGs, file1WebPs, file1PNGs, file1MP3s, file1MP4s,
                             file2SVGs, file2WebPs, file2PNGs, file2MP3s, file2MP4s);
            }
        }
    };

    reader.readAsText(file);
}

setupDropZone('dropZone1', 'fileInput1', 'status1', processFile);
setupDropZone('dropZone2', 'fileInput2', 'status2', processFile);