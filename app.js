document.addEventListener('DOMContentLoaded', () => {
    const poster = document.getElementById('poster');
    const posterContainer = document.getElementById('poster-container');
    const posterTitle = document.getElementById('poster-title');
    const posterDate = document.getElementById('poster-date');
    const posterLocation = document.getElementById('poster-location');
    const posterImagem = document.getElementById('poster-imagem'); 
    const exportButton = document.getElementById('export-button');
    const styleSelect = document.getElementById('style-select');
    const exportWidthInput = document.getElementById('export-width'); 
    const icsUpload = document.getElementById('ics-upload');
    const icsUploadLabel = document.getElementById('ics-upload-label');
    const textColorInput = document.getElementById('text-color');
    const bgColorInput = document.getElementById('bg-color');
    const imagemTextInput = document.getElementById('imagem-text'); 
    const importUrlField = document.getElementById('import-url-field'); 
    const importUrlButton = document.getElementById('import-url-button'); 

    // Standardwerte
    const DEFAULT_DATA = {
        title: 'EVENT TITEL',
        date: new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' }),
        location: 'ORT / ADRESSE',
        style: 'modern',
        imagem: 'Event-Poster erstellt mit [App-Name]',
        exportWidth: 1080 
    };

    let currentData = { ...DEFAULT_DATA };


    /**
     * HILFSFUNKTIONEN
     */

    function formatDate(dateStartString, dateEndString = null) {
        try {
            const startDate = new Date(dateStartString);
            if (isNaN(startDate.getTime())) return dateStartString;

            const optionsDate = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
            let formattedString = startDate.toLocaleDateString('de-DE', optionsDate);

            if (dateEndString) {
                const endDate = new Date(dateEndString);
                const startTime = startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

                // Nur Endzeit anzeigen, wenn es der gleiche Tag ist und eine sinnvolle Dauer existiert
                if (startDate.toDateString() === endDate.toDateString() && !isNaN(endDate.getTime())) {
                     const endTime = endDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                     formattedString = `${formattedString} | ${startTime} - ${endTime}`;
                } else {
                     formattedString = `${formattedString} | ${startTime}`;
                }
            }
            
            return formattedString;
        } catch (e) {
            return dateStartString;
        }
    }
    
    // Parsen von URL-Parametern aus einem String
    function parseUrlParams(urlSearchString) {
        const params = new URLSearchParams(urlSearchString.startsWith('?') ? urlSearchString.substring(1) : urlSearchString);
        return {
            title: params.get('title'),
            date: params.get('date') || params.get('start'),
            end: params.get('end'), 
            location: params.get('location'),
            style: params.get('style'), 
            width: params.get('width'),
            query: params.get('query') // NEU: Fängt den gesamten Shortcut-String ab
        };
    }

    /**
     * 2. Poster mit aktuellen Daten, Stil und Farben befüllen/aktualisieren
     */
    function updatePoster() {
        
        const selectedStyle = styleSelect.value;
        
        poster.className = `poster ${selectedStyle}`;

        currentData.imagem = imagemTextInput.value;
        posterImagem.textContent = currentData.imagem;

        // Poster-Text aktualisieren
        posterTitle.textContent = posterTitle.textContent.trim() === '' || posterTitle.textContent === DEFAULT_DATA.title ? currentData.title : posterTitle.textContent;
        posterDate.textContent = posterDate.textContent.trim() === '' || posterDate.textContent === formatDate(DEFAULT_DATA.date) ? formatDate(currentData.date, currentData.end) : posterDate.textContent;
        posterLocation.textContent = posterLocation.textContent.trim() === '' || posterLocation.textContent === DEFAULT_DATA.location ? currentData.location : posterLocation.textContent;


        // Farben anwenden
        const textColor = textColorInput.value;
        const bgColor = bgColorInput.value;
        
        poster.style.color = textColor;
        
        if (selectedStyle === 'modern') {
            poster.style.backgroundColor = bgColor;
            poster.style.borderColor = 'transparent';
        } else {
            poster.style.backgroundColor = ''; 
            poster.style.borderColor = textColor;
        }
    }

    /**
     * 3. Import-Logik (ICS und URL-Parameter)
     */
    function updateDataFromParams(params) {
        let importedData = {};

        // Datenfelder
        if (params.title) importedData.title = params.title;
        if (params.date) importedData.date = params.date;
        if (params.end) importedData.end = params.end;
        if (params.location) importedData.location = params.location;
        if (params.style) {
            importedData.style = params.style;
            styleSelect.value = params.style; 
        }
        
        // Exportbreite (Pixeleinstellung)
        const widthValue = parseInt(params.width);
        if (!isNaN(widthValue) && widthValue > 100) {
             importedData.exportWidth = widthValue;
             exportWidthInput.value = widthValue; // Input-Feld aktualisieren
        }
        
        // Globale Daten aktualisieren
        currentData = {
            ...currentData,
            ...importedData
        };

        // DOM-Elemente direkt aktualisieren
        posterTitle.textContent = currentData.title;
        posterDate.textContent = formatDate(currentData.date, currentData.end);
        posterLocation.textContent = currentData.location;
        
        updatePoster();
    }
    
    function handleUrlImport() {
        const urlString = importUrlField.value.trim();
        if (!urlString) {
            alert("Bitte eine URL-Abfrage (z.B. title=Event&start=...) eingeben.");
            return;
        }
        
        // Stellt sicher, dass das Query-String korrekt geparst wird (ohne führendes ?)
        const params = parseUrlParams(urlString); 
        updateDataFromParams(params);
        importUrlField.value = ''; 
        // Optional: Kurzes Feedback im Feld
        importUrlField.placeholder = "Daten erfolgreich geladen!";
        setTimeout(() => importUrlField.placeholder = "z.B.: title=Event&width=1080&start=...", 2000);
    }
    
    function handleIcsFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        icsUploadLabel.textContent = '⏳ Analysiere Datei...';
        icsUploadLabel.classList.add('loading');
        
        // ... (ICS-Parsing-Logik wie zuvor, ruft updateDataFromParams auf) ...
        if (typeof ICAL === 'undefined') {
            alert('Die ical.js Bibliothek konnte nicht geladen werden.');
            icsUploadLabel.textContent = '📅 .ICS Datei importieren';
            icsUploadLabel.classList.remove('loading');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const jcalData = ICAL.parse(e.target.result);
                const comp = new ICAL.Component(jcalData);
                const event = comp.getFirstSubcomponent('vevent');

                if (event) {
                    const title = event.getFirstPropertyValue('summary');
                    const location = event.getFirstPropertyValue('location');
                    const dtstart = event.getFirstPropertyValue('dtstart');
                    const dtend = event.getFirstPropertyValue('dtend'); 

                    const date = dtstart ? dtstart.toJSDate().toISOString() : DEFAULT_DATA.date; 
                    const end = dtend ? dtend.toJSDate().toISOString() : null; 

                    updateDataFromParams({
                        title: title,
                        date: date,
                        end: end, 
                        location: location
                    });
                    
                    icsUploadLabel.textContent = `✅ ${title} importiert!`;

                } else {
                    alert('Kein gültiges VEVENT in der ICS-Datei gefunden.');
                    icsUploadLabel.textContent = '❌ Fehler beim Import';
                }
            } catch (error) {
                console.error('ICS Parsing Fehler:', error);
                alert('Fehler beim Parsen der ICS-Datei. Prüfen Sie das Format.');
                icsUploadLabel.textContent = '❌ Fehler beim Import';
            } finally {
                icsUploadLabel.classList.remove('loading');
                setTimeout(() => {
                    icsUploadLabel.textContent = '📅 .ICS Datei importieren';
                }, 3000);
            }
        };

        reader.readAsText(file);
    }
    
    /**
     * 4. Initiale Einrichtung und Event Listener
     */
    function initialize() {
        const urlParams = parseUrlParams(window.location.search);
        
        // Wenn der Shortcut den 'query'-Parameter gesetzt hat, tragen wir ihn ins Feld ein.
        if (urlParams.query) {
            importUrlField.value = urlParams.query;
            handleUrlImport(); // Import automatisch auslösen
            // WICHTIG: Die URL wird beim Öffnen der Seite *nicht* neu geladen,
            // wenn die Seite bereits als PWA installiert ist.
        } else {
            // Standard-Initialisierung über direkte URL-Parameter
            updateDataFromParams(urlParams);
        }
        
        // Input-Felder mit Standard/Geladenen Werten setzen
        imagemTextInput.value = DEFAULT_DATA.imagem;
        exportWidthInput.value = currentData.exportWidth || DEFAULT_DATA.exportWidth;
        
        // Event Listener für Controls
        styleSelect.addEventListener('change', updatePoster);
        exportWidthInput.addEventListener('input', updatePoster); 
        textColorInput.addEventListener('input', updatePoster);
        bgColorInput.addEventListener('input', updatePoster);
        imagemTextInput.addEventListener('input', updatePoster);
        
        // Import Listener
        icsUpload.addEventListener('change', handleIcsFile);
        icsUpload.addEventListener('click', () => { icsUpload.value = null; });
        importUrlButton.addEventListener('click', handleUrlImport); 
        
        // Export-Logik
        exportButton.addEventListener('click', exportPoster);
    }

    // --- 5. Export-Funktion (Nutzt Pixel-Einstellung) ---
    async function exportPoster() {
        exportButton.disabled = true;
        exportButton.textContent = 'Erzeuge Bild...';

        const targetWidth = parseInt(exportWidthInput.value);
        if (isNaN(targetWidth) || targetWidth < 200) {
             alert("Bitte eine gültige Pixelbreite (min. 200px) eingeben.");
             exportButton.textContent = 'Als Bild speichern / Teilen';
             exportButton.disabled = false;
             return;
        }

        const previewWidth = poster.offsetWidth;
        const scaleFactor = targetWidth / previewWidth;


        try {
            const canvas = await html2canvas(poster, {
                scale: scaleFactor, 
                useCORS: true,
                backgroundColor: null, 
                allowTaint: true
            });

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const files = [{
                name: 'event-poster.png',
                lastModified: new Date(),
                type: blob.type,
                size: blob.size,
                kind: 'image',
                blob: blob
            }];

            const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;

            if (navigator.canShare && navigator.canShare({ files }) && !isIOS) {
                await navigator.share({
                    files: files.map(f => new File([f.blob], f.name, { type: f.type })),
                    title: posterTitle.textContent,
                    text: `Schau dir dieses Event-Poster an: ${posterTitle.textContent}`,
                });
            } else {
                const url = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = url;
                a.download = `${posterTitle.textContent.replace(/\s/g, '-')}-poster.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                if (isIOS) {
                    alert("Ihr Bild wurde zum Speichern/Teilen heruntergeladen. Bitte im Browser-Download-Menü oder über das Teilen-Menü die Option 'Bild sichern' wählen.");
                }
            }

        } catch (error) {
            console.error('Fehler beim Exportieren/Teilen:', error);
            alert(`Es gab einen Fehler beim Exportieren oder Teilen. ${error.message}`);
        } finally {
            exportButton.textContent = 'Als Bild speichern / Teilen';
            exportButton.disabled = false;
        }
    }

    initialize();
});
