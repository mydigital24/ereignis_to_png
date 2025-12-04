document.addEventListener('DOMContentLoaded', () => {
    const poster = document.getElementById('poster');
    const posterTitle = document.getElementById('poster-title');
    const posterDate = document.getElementById('poster-date');
    const posterLocation = document.getElementById('poster-location');
    const exportButton = document.getElementById('export-button');
    const styleSelect = document.getElementById('style-select');
    const icsUpload = document.getElementById('ics-upload');
    const icsUploadLabel = document.getElementById('ics-upload-label');
    const textColorInput = document.getElementById('text-color');
    const bgColorInput = document.getElementById('bg-color');

    // Standardwerte für den Fall, dass keine Daten vorhanden sind
    const DEFAULT_DATA = {
        title: 'EVENT TITEL',
        date: new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' }),
        location: 'ORT / ADRESSE',
        style: 'modern'
    };

    let currentData = { ...DEFAULT_DATA };


    /**
     * HILFSFUNKTIONEN
     */

    function formatDate(dateStartString, dateEndString = null) {
        // Formatiert das Datum, ggf. inklusive Enddatum (unterstützt ICS und Shortcut-Parameter)
        try {
            const startDate = new Date(dateStartString);
            if (isNaN(startDate.getTime())) return dateStartString; // Ungültiges Startdatum

            const optionsDate = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
            let formattedString = startDate.toLocaleDateString('de-DE', optionsDate);

            // Wenn Enddatum vorhanden und gültig
            if (dateEndString) {
                const endDate = new Date(dateEndString);
                const startTime = startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                const endTime = endDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

                // Nur Start- und Endzeit anzeigen, wenn es der gleiche Tag ist und eine sinnvolle Dauer existiert
                if (startDate.toDateString() === endDate.toDateString() && !isNaN(endDate.getTime())) {
                     formattedString = `${formattedString} | ${startTime} - ${endTime}`;
                } else {
                     // Ansonsten nur das Startdatum mit Startzeit
                     formattedString = `${formattedString} | ${startTime}`;
                }
            }
            
            return formattedString;
        } catch (e) {
            console.error("Formatierungsfehler:", e);
            return dateStartString;
        }
    }

    function getUrlParams() {
        // Liest Parameter, wobei 'start' und 'end' für den iOS Shortcut verwendet werden
        const params = new URLSearchParams(window.location.search);
        return {
            title: params.get('title'),
            date: params.get('date') || params.get('start'), // 'start' hat Vorrang, wenn vorhanden
            end: params.get('end'), 
            location: params.get('location'),
            style: params.get('style') || DEFAULT_DATA.style
        };
    }


    /**
     * 2. Poster mit aktuellen Daten, Stil und Farben befüllen/aktualisieren
     */
    function updatePoster() {
        
        const selectedStyle = styleSelect.value;
        poster.className = `poster ${selectedStyle}`;

        // Textfelder nur mit aktuellen Daten befüllen, wenn sie noch die Standardwerte enthalten 
        // oder wenn ein ICS-Import stattgefunden hat. Ansonsten bleiben manuelle Änderungen erhalten.
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
            // Elegant-Stil: Akzentfarbe = Textfarbe
            poster.style.backgroundColor = ''; 
            poster.style.borderColor = textColor;
        }
    }

    /**
     * 3. ICS-Datei parsen und Poster befüllen (mit Robustheit und Feedback)
     */
    function handleIcsFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        icsUploadLabel.textContent = '⏳ Analysiere Datei...';
        icsUploadLabel.classList.add('loading');
        
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

                    currentData = {
                        ...currentData,
                        title: title || DEFAULT_DATA.title,
                        date: date,
                        end: end, 
                        location: location || DEFAULT_DATA.location
                    };
                    
                    // DOM-Elemente direkt aktualisieren 
                    posterTitle.textContent = currentData.title;
                    posterDate.textContent = formatDate(currentData.date, currentData.end); 
                    posterLocation.textContent = currentData.location;
                    
                    updatePoster(); 
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
        reader.onerror = function() {
            alert('Fehler beim Lesen der Datei.');
            icsUploadLabel.textContent = '❌ Fehler beim Import';
            icsUploadLabel.classList.remove('loading');
        };

        reader.readAsText(file);
    }

    /**
     * 4. Initiale Einrichtung und Event Listener
     */
    function initialize() {
        const urlParams = getUrlParams();
        
        // currentData mit URL-Parametern überschreiben
        currentData = {
            ...currentData,
            title: urlParams.title || currentData.title,
            date: urlParams.date || currentData.date,
            end: urlParams.end, 
            location: urlParams.location || currentData.location,
            style: urlParams.style || currentData.style
        };
        
        styleSelect.value = currentData.style;
        
        updatePoster(); // Initial-Call

        // Event Listener für Controls
        styleSelect.addEventListener('change', updatePoster);
        textColorInput.addEventListener('input', updatePoster);
        bgColorInput.addEventListener('input', updatePoster);
        
        // ICS Import Listener
        icsUpload.addEventListener('change', handleIcsFile);
        icsUpload.addEventListener('click', () => { 
            icsUpload.value = null; 
        });

        // Export-Logik
        exportButton.addEventListener('click', exportPoster);
    }

    // --- 5. Export-Funktion ---
    async function exportPoster() {
        exportButton.disabled = true;
        exportButton.textContent = 'Erzeuge Bild...';

        try {
            const canvas = await html2canvas(poster, {
                scale: 3, 
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

            if (navigator.canShare && navigator.canShare({ files })) {
                await navigator.share({
                    files: files.map(f => new File([f.blob], f.name, { type: f.type })),
                    title: posterTitle.textContent,
                    text: `Schau dir dieses Event-Poster an: ${posterTitle.textContent}`,
                });
                console.log('Teilen erfolgreich abgeschlossen');
            } else {
                const url = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = url;
                a.download = `${posterTitle.textContent.replace(/\s/g, '-')}-poster.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }

        } catch (error) {
            console.error('Fehler beim Exportieren/Teilen:', error);
            alert(`Es gab einen Fehler beim Exportieren oder Teilen. ${error.message}`);
        } finally {
            exportButton.textContent = 'Als Bild exportieren / Teilen';
            exportButton.disabled = false;
        }
    }

    initialize();
});