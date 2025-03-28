// Centralized state management
const state = {
  files: {
    file1: { svgs: new Set(), webps: new Set(), pngs: new Set(), mp3s: new Set(), mp4s: new Set() },
    file2: { svgs: new Set(), webps: new Set(), pngs: new Set(), mp3s: new Set(), mp4s: new Set() }
  },
  comparisonMode: false,
  showChangedOnly: false,
  currentViewType: 'all', // 'all', 'svg', 'webp', 'png', 'mp3', 'mp4'
  selectedBaseUrl: 'https://tankionline.com/play/static/'
};

// UI elements
const elements = {
  toggleButton: document.getElementById('toggleCompare'),
  toggleChangedButton: document.getElementById('toggleChanged'),
  toggles: {
    svg: document.getElementById('toggleSVG'),
    webp: document.getElementById('toggleWebP'),
    png: document.getElementById('togglePNG'),
    mp3: document.getElementById('toggleMP3'),
    mp4: document.getElementById('toggleMP4'),
    all: document.getElementById('toggleAll')
  },
  fileInputsContainer: document.querySelector('.file-inputs'),
  galleriesContainer: document.querySelector('.galleries'),
  secondaryFileInput: document.getElementById('dropZone2'),
  secondaryGallery: document.getElementById('gallery2'),
  diffSummary: document.getElementById('diffSummary')
};

// Base URL options
const urlOptions = [
  { value: 'https://tankionline.com/play/static/', label: 'Default (tankionline.com)' },
  { value: 'https://public-deploy1.test-eu.tankionline.com/browser-public/static/', label: 'Deploy 1' },
  { value: 'https://public-deploy2.test-eu.tankionline.com/browser-public/static/', label: 'Deploy 2' },
  { value: 'https://public-deploy3.test-eu.tankionline.com/browser-public/static/', label: 'Deploy 3' },
  { value: 'https://public-deploy4.test-eu.tankionline.com/browser-public/static/', label: 'Deploy 4' },
  { value: 'https://public-deploy5.test-eu.tankionline.com/browser-public/static/', label: 'Deploy 5' },
  { value: 'https://public-deploy6.test-eu.tankionline.com/browser-public/static/', label: 'Deploy 6' },
  { value: 'https://public-deploy7.test-eu.tankionline.com/browser-public/static/', label: 'Deploy 7' }
];

// Initialize base URL selector
const baseUrlSelector = createBaseUrlSelector();
elements.fileInputsContainer.prepend(baseUrlSelector);

// Event listeners
baseUrlSelector.addEventListener('change', () => {
  state.selectedBaseUrl = baseUrlSelector.value;
  updateGalleries();
});

elements.toggleButton.addEventListener('click', () => {
  state.comparisonMode = !state.comparisonMode;
  elements.toggleButton.textContent = state.comparisonMode ? 'Disable Comparison Mode' : 'Enable Comparison Mode';
  updateUIForComparisonMode();
  updateGalleries();
});

elements.toggleChangedButton.addEventListener('click', () => {
  state.showChangedOnly = !state.showChangedOnly;
  elements.toggleChangedButton.textContent = state.showChangedOnly ? 'Show All' : 'Only Show Changes';
  updateGalleries();
});

Object.entries(elements.toggles).forEach(([type, button]) => {
  button.addEventListener('click', () => setViewType(type));
});

// Utility functions
function createBaseUrlSelector() {
  const select = document.createElement('select');
  select.id = 'baseUrlSelector';
  urlOptions.forEach(({ value, label }) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  });
  return select;
}

function hasFiles(fileSet) {
  return Object.values(fileSet).some(set => set.size > 0);
}

function setViewType(type) {
  state.currentViewType = type;
  Object.values(elements.toggles).forEach(button => button.classList.remove('active'));
  elements.toggles[type].classList.add('active');

  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    const sectionType = section.className.match(/(svg|webp|png|mp3|mp4)-section/)[1];
    section.classList.toggle('hidden-type', type !== 'all' && type !== sectionType);
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

// File processing
function setupDropZone({ dropZoneId, fileInputId, statusId, galleryId }) {
  const dropZone = document.getElementById(dropZoneId);
  const fileInput = document.getElementById(fileInputId);
  const status = document.getElementById(statusId);

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
    dropZone.addEventListener(event, preventDefaults, false);
  });

  ['dragenter', 'dragover'].forEach(event => {
    dropZone.addEventListener(event, () => highlight(dropZone), false);
  });

  ['dragleave', 'drop'].forEach(event => {
    dropZone.addEventListener(event, () => unhighlight(dropZone), false);
  });

  dropZone.addEventListener('drop', e => processFile(e.dataTransfer.files[0], status, galleryId));
  fileInput.addEventListener('change', e => processFile(e.target.files[0], status, galleryId));
}

function processFile(file, statusElement, galleryId) {
  if (!file) return;

  statusElement.textContent = 'Processing file...';
  const reader = new FileReader();

  reader.onload = e => {
    try {
      const content = e.target.result;
      const extracted = extractMedia(content);
      const target = galleryId === 'gallery1' ? 'file1' : 'file2';
      Object.assign(state.files[target], extracted);

      updateGalleries();
      statusElement.textContent = `Processed ${extracted.svgs.size} SVGs, ${extracted.webps.size} WebPs, ${extracted.pngs.size} PNGs, ${extracted.mp3s.size} MP3s, ${extracted.mp4s.size} MP4s`;
      if (state.comparisonMode) updateDiffSummary();
    } catch (error) {
      statusElement.textContent = `Error processing file: ${error.message}`;
      console.error(error);
    }
  };

  reader.onerror = () => {
    statusElement.textContent = 'Error reading file';
  };

  reader.readAsText(file);
}

function extractMedia(content) {
  const patterns = {
    svg: /['"]([^'"]*\.svg)['"]/g,
    webp: /['"]([^'"]*\.webp)['"]/g,
    png: /['"]([^'"]*\.png)['"]/g,
    mp3: /['"]([^'"]*\.mp3)['"]/g,
    mp4: /['"]([^'"]*\.(mp4|webm))['"]/g
  };

  const results = { svgs: new Set(), webps: new Set(), pngs: new Set(), mp3s: new Set(), mp4s: new Set() };
  Object.entries(patterns).forEach(([type, regex]) => {
    const matches = [...content.matchAll(regex)];
    matches.forEach(match => results[`${type}s`].add(match[1].split('/').pop()));
  });
  return results;
}

// Gallery rendering
function getMimeType(fileName, type) {
  if (type === 'mp3') return 'audio/mpeg';
  if (type === 'mp4') {
    if (fileName.endsWith('.mp4')) return 'video/mp4';
    if (fileName.endsWith('.webm')) return 'video/webm';
  }
  return null;
}

function createMediaPreview(fileName, type) {
  const basePaths = {
    svg: 'images',
    webp: 'images',
    png: 'images',
    mp3: 'sound',
    mp4: 'videos'
  };
  const fullPath = `${state.selectedBaseUrl}${basePaths[type]}/${fileName}`;

  let element;
  if (type === 'mp3' || type === 'mp4') {
    element = document.createElement(type === 'mp3' ? 'audio' : 'video');
    element.controls = true;
    const source = document.createElement('source');
    source.src = fullPath;
    source.type = getMimeType(fileName, type);
    element.appendChild(source);
    element.appendChild(document.createTextNode(`Your browser does not support the ${type === 'mp3' ? 'audio' : 'video'} tag.`));
  } else {
    element = document.createElement('img');
    element.src = fullPath;
    element.alt = fileName;
    element.loading = 'lazy';
  }

  element.setAttribute('aria-label', `${type.toUpperCase()} file: ${fileName}`);
  element.onerror = () => {
    console.error(`Failed to load ${fullPath}`);
    element.parentElement.remove();
  };
  return element;
}

function createSection(galleryId, type, files, otherFiles) {
  const section = document.createElement('div');
  section.className = `section ${type.toLowerCase()}-section`;

  const header = document.createElement('h3');
  header.textContent = `${type} Files (${files.size})`;
  section.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'image-grid';

  files.forEach(fileName => {
    const container = document.createElement('div');
    container.className = 'image-container';

    if (state.comparisonMode && otherFiles) {
      const isChanged = !otherFiles.has(fileName);
      if (isChanged) container.classList.add(galleryId === 'gallery2' ? 'added' : 'removed');
      if (state.showChangedOnly && !isChanged) return;
    }

    const media = createMediaPreview(fileName, type.toLowerCase());
    const name = document.createElement('div');
    name.className = 'filename';
    name.textContent = fileName;

    container.appendChild(media);
    container.appendChild(name);
    grid.appendChild(container);
  });

  section.appendChild(grid);
  return section;
}

function createGallery(galleryId) {
  const gallery = document.getElementById(galleryId);
  const header = gallery.querySelector('.gallery-header');
  gallery.innerHTML = '';
  gallery.appendChild(header);

  const files = state.files[galleryId === 'gallery1' ? 'file1' : 'file2'];
  const otherFiles = state.files[galleryId === 'gallery1' ? 'file2' : 'file1'];
  const totalFiles = Object.values(files).reduce((sum, set) => sum + set.size, 0);
  gallery.querySelector('span').textContent = `${totalFiles} Files`;

  const sections = [
    { type: 'SVG', files: files.svgs, otherFiles: otherFiles.svgs },
    { type: 'WebP', files: files.webps, otherFiles: otherFiles.webps },
    { type: 'PNG', files: files.pngs, otherFiles: otherFiles.pngs },
    { type: 'MP3', files: files.mp3s, otherFiles: otherFiles.mp3s },
    { type: 'MP4', files: files.mp4s, otherFiles: otherFiles.mp4s }
  ];

  sections.forEach(({ type, files, otherFiles }) => {
    if (files.size > 0) gallery.appendChild(createSection(galleryId, type, files, otherFiles));
  });

  setViewType(state.currentViewType);
}

function updateGalleries() {
  if (hasFiles(state.files.file1)) createGallery('gallery1');
  if (hasFiles(state.files.file2)) createGallery('gallery2');
}

function updateUIForComparisonMode() {
  const { comparisonMode } = state;
  elements.fileInputsContainer.classList.toggle('comparison-mode', comparisonMode);
  elements.galleriesContainer.classList.toggle('comparison-mode', comparisonMode);
  elements.secondaryFileInput.classList.toggle('hidden', !comparisonMode);
  elements.secondaryGallery.classList.toggle('hidden', !comparisonMode);
  elements.diffSummary.classList.toggle('hidden', !comparisonMode);
  elements.toggleChangedButton.classList.toggle('hidden', !comparisonMode);
}

function updateDiffSummary() {
  const { file1, file2 } = state.files;
  const diff = { added: {}, removed: {} };
  const types = ['svgs', 'webps', 'pngs', 'mp3s', 'mp4s'];

  types.forEach(type => {
    diff.added[type] = [...file2[type]].filter(file => !file1[type].has(file)).length;
    diff.removed[type] = [...file1[type]].filter(file => !file2[type].has(file)).length;
  });

  elements.diffSummary.innerHTML = `
    <h3>Changes Summary</h3>
    <p>Added: ${diff.added.svgs} SVGs, ${diff.added.webps} WebPs, ${diff.added.pngs} PNGs, ${diff.added.mp3s} MP3s, ${diff.added.mp4s} MP4s</p>
    <p>Removed: ${diff.removed.svgs} SVGs, ${diff.removed.webps} WebPs, ${diff.removed.pngs} PNGs, ${diff.removed.mp3s} MP3s, ${diff.removed.mp4s} MP4s</p>
  `;
}

// Initialize drop zones
setupDropZone({ dropZoneId: 'dropZone1', fileInputId: 'fileInput1', statusId: 'status1', galleryId: 'gallery1' });
setupDropZone({ dropZoneId: 'dropZone2', fileInputId: 'fileInput2', statusId: 'status2', galleryId: 'gallery2' });
