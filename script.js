// Rendre les fonctions globales pour qu'elles soient accessibles depuis le HTML
window.generateModules = generateModules;
window.removeUnite = removeUnite;
window.removeModule = removeModule;
window.addModule = addModule;
window.calculateUniteDuration = calculateUniteDuration;

document.getElementById('pedagogicalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Collecte de toutes les données du formulaire
    const formData = new FormData(this);
    const data = {};
    
    // Récupération des champs simples
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            // Si la clé existe déjà, on transforme en tableau
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }
    
    // Collecte des unités et modules
    const unites = [];
    const unitesElements = document.querySelectorAll('.unite-block');
    
    unitesElements.forEach((uniteEl, uniteIndex) => {
        const uniteTitre = uniteEl.querySelector(`input[name="unite_${uniteIndex}_titre"]`).value;
        const uniteFormat = uniteEl.querySelector(`select[name="unite_${uniteIndex}_format"]`).value;
        const uniteDuree = uniteEl.querySelector(`input[name="unite_${uniteIndex}_duree"]`).value;
        const modules = [];
        
        const modulesElements = uniteEl.querySelectorAll('.module-block');
        modulesElements.forEach((moduleEl, moduleIndex) => {
            const moduleTitre = moduleEl.querySelector(`input[name="unite_${uniteIndex}_module_${moduleIndex}_titre"]`).value;
            const moduleDuree = moduleEl.querySelector(`input[name="unite_${uniteIndex}_module_${moduleIndex}_duree"]`).value;
            
            modules.push({
                titre: moduleTitre,
                duree: moduleDuree
            });
        });
        
        unites.push({
            titre: uniteTitre,
            format: uniteFormat,
            duree: uniteDuree,
            modules: modules
        });
    });
    
    data.unites = unites;
    
    // Affichage des données (pour test)
    console.log('Données du formulaire:', JSON.stringify(data, null, 2));
    
    // OPTION 1: Envoi vers une API (Make, Zapier, ou votre backend)
    sendToAPI(data);
    
});

// Génération de la structure des unités et modules
document.getElementById('generateStructure').addEventListener('click', function() {
    const nbUnites = parseInt(document.getElementById('nbUnites').value);
    const container = document.getElementById('unitesContainer');
    
    // Réinitialiser le conteneur
    container.innerHTML = '';
    
    // Créer les unités
    for (let i = 0; i < nbUnites; i++) {
        createUnite(i, container);
    }
    
    // Afficher le bouton "Ajouter une unité"
    document.getElementById('addUnite').style.display = 'inline-block';
});

// Bouton pour ajouter une unité supplémentaire
document.getElementById('addUnite').addEventListener('click', function() {
    const container = document.getElementById('unitesContainer');
    const unites = container.querySelectorAll('.unite-block');
    const newUniteIndex = unites.length;
    
    createUnite(newUniteIndex, container);
});

function createUnite(uniteIndex, container) {
    const uniteBlock = document.createElement('div');
    uniteBlock.className = 'unite-block';
    uniteBlock.dataset.uniteIndex = uniteIndex;
    
    uniteBlock.innerHTML = `
        <div class="unite-header">
            <span>Unité ${uniteIndex + 1}</span>
            <div>
                <span class="unite-number">📚</span>
                ${uniteIndex > 0 ? `<button type="button" class="btn-remove-unite" onclick="removeUnite(this)">Supprimer l'unité</button>` : ''}
            </div>
        </div>
        
        <div class="form-group">
            <label for="unite_${uniteIndex}_titre">Titre de l'unité <span class="required">*</span></label>
            <input type="text" id="unite_${uniteIndex}_titre" name="unite_${uniteIndex}_titre" required placeholder="Ex: Introduction aux urgences cardiaques">
        </div>
        
        <div class="two-columns">
            <div class="form-group">
                <label for="unite_${uniteIndex}_format">Format de l'unité <span class="required">*</span></label>
                <select id="unite_${uniteIndex}_format" name="unite_${uniteIndex}_format" required>
                    <option value="">-- Sélectionnez un format --</option>
                    <option value="presentiel">🏢 Présentiel</option>
                    <option value="distanciel">💻 Distanciel</option>
                    <option value="mixte">🔄 Mixte</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="unite_${uniteIndex}_duree">Durée de l'unité (en heures)</label>
                <input <input type="number" id="unite_${uniteIndex}_duree" name="unite_${uniteIndex}_duree" data-type="unite-duree" min="0" step="0.01" readonly style="background-color: #f0f0f0; cursor: not-allowed;" value="0"/>
>
                <div class="help-text">Calculée automatiquement</div>
            </div>
        </div>
        
        <div class="form-group">
            <label for="unite_${uniteIndex}_nbModules">Nombre de modules dans cette unité <span class="required">*</span></label>
            <input type="number" id="unite_${uniteIndex}_nbModules" name="unite_${uniteIndex}_nbModules" min="1" max="20" value="1" required>
            <button type="button" class="btn-generate" onclick="generateModules(${uniteIndex})">Générer les modules</button>
        </div>
        
        <div class="modules-container" id="modulesContainer_${uniteIndex}"></div>
    `;
    
    container.appendChild(uniteBlock);
}

function removeUnite(btn) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette unité et tous ses modules ?')) {
        const uniteBlock = btn.closest('.unite-block');
        uniteBlock.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            uniteBlock.remove();
            renumberUnites();
            calculateTotalDuration();
        }, 300);
    }
}

function renumberUnites() {
    const unites = document.querySelectorAll('.unite-block');
    unites.forEach((unite, index) => {
        unite.dataset.uniteIndex = index;
        const header = unite.querySelector('.unite-header span:first-child');
        header.textContent = `Unité ${index + 1}`;
    });
}

function generateModules(uniteIndex) {
    const nbModules = parseInt(document.getElementById(`unite_${uniteIndex}_nbModules`).value);
    const container = document.getElementById(`modulesContainer_${uniteIndex}`);
    
    // Réinitialiser le conteneur
    container.innerHTML = '';
    
    for (let i = 0; i < nbModules; i++) {
        createModule(uniteIndex, i, container);
    }
    
    // Ajouter le bouton pour ajouter un module supplémentaire
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn-add-module';
    addBtn.textContent = '+ Ajouter un module';
    addBtn.onclick = () => addModule(uniteIndex);
    container.appendChild(addBtn);
}

function createModule(uniteIndex, moduleIndex, container) {
    const moduleBlock = document.createElement('div');
    moduleBlock.className = 'module-block';
    moduleBlock.dataset.moduleIndex = moduleIndex;
    
    moduleBlock.innerHTML = `
        <div class="module-header">
            Module ${moduleIndex + 1}
            ${moduleIndex > 0 ? `<button type="button" class="btn-remove-module" onclick="removeModule(this, ${uniteIndex})">✕ Supprimer</button>` : ''}
        </div>
        
        <div class="two-columns">
            <div class="form-group">
                <label for="unite_${uniteIndex}_module_${moduleIndex}_titre">Titre du module <span class="required">*</span></label>
                <input type="text" id="unite_${uniteIndex}_module_${moduleIndex}_titre" name="unite_${uniteIndex}_module_${moduleIndex}_titre" required placeholder="Ex: Reconnaissance des symptômes">
            </div>
            
            <div class="form-group">
                <label for="unite_${uniteIndex}_module_${moduleIndex}_duree">Durée (en minutes) <span class="required">*</span></label>
                <input type="number" id="unite_${uniteIndex}_module_${moduleIndex}_duree" name="unite_${uniteIndex}_module_${moduleIndex}_duree" min="5" step="5" required placeholder="Ex: 30" onchange="calculateUniteDuration(${uniteIndex})">
            </div>
        </div>
    `;
    
    container.appendChild(moduleBlock);
}

// Fonction pour calculer la durée d'une unité
function calculateUniteDuration(uniteIndex) {
    const modulesContainer = document.getElementById(`modulesContainer_${uniteIndex}`);
    const modulesDuree = modulesContainer.querySelectorAll('input[type="number"][name*="_duree"]');
    
    let totalMinutes = 0;
    modulesDuree.forEach(input => {
        const value = parseInt(input.value) || 0;
        totalMinutes += value;
    });
    
    // Convertir en heures
    const totalHours = (totalMinutes / 60).toFixed(2);
    
    // Mettre à jour le champ durée de l'unité
    const uniteDureeInput = document.getElementById(`unite_${uniteIndex}_duree`);
    if (uniteDureeInput) {
        uniteDureeInput.value = totalHours;
    }
    
    // Recalculer la durée totale
    calculateTotalDuration();
}

// Fonction pour calculer la durée totale de la formation

function calculateTotalDuration() {
    const uniteDureeInputs = document.querySelectorAll(
        'input[data-type="unite-duree"]'
    );

    let totalHours = 0;

    uniteDureeInputs.forEach(input => {
        const value = parseFloat(input.value);
        if (!isNaN(value)) {
            totalHours += value;
        }
    });

    const dureeTotaleInput = document.getElementById('duree');
    if (dureeTotaleInput) {
        dureeTotaleInput.value = totalHours.toFixed(2);
    }
}

function addModule(uniteIndex) {
    const container = document.getElementById(`modulesContainer_${uniteIndex}`);
    const modules = container.querySelectorAll('.module-block');
    const newModuleIndex = modules.length;
    
    // Retirer le bouton d'ajout temporairement
    const addBtn = container.querySelector('.btn-add-module');
    if (addBtn) addBtn.remove();
    
    // Créer le nouveau module
    createModule(uniteIndex, newModuleIndex, container);
    
    // Remettre le bouton d'ajout
    const newAddBtn = document.createElement('button');
    newAddBtn.type = 'button';
    newAddBtn.className = 'btn-add-module';
    newAddBtn.textContent = '+ Ajouter un module';
    newAddBtn.onclick = () => addModule(uniteIndex);
    container.appendChild(newAddBtn);
}

function removeModule(btn, uniteIndex) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce module ?')) {
        btn.closest('.module-block').remove();
        calculateUniteDuration(uniteIndex);
    }
}

// OPTION 1: Envoi vers Make.com ou une autre API
async function sendToAPI(data) {
    try {
        // Remplacez cette URL par votre webhook Make.com
        const webhookURL = 'https://hook.eu2.make.com/neigsfankcqam0rtz7qogp1wf0qmbt1f';
        
        console.log('📤 Envoi des données vers:', webhookURL);
        console.log('📦 Données envoyées:', data);
        
        const response = await fetch(webhookURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        console.log('📥 Statut de la réponse:', response.status);
        
        if (response.ok) {
            const result = await response.text();
            console.log('✅ Réponse du serveur:', result);
            showResult('✅ Formulaire soumis avec succès ! Les données ont été transmises.', true);
        } else {
            const errorText = await response.text();
            console.error('❌ Erreur du serveur:', errorText);
            showResult(`❌ Erreur ${response.status}: ${errorText || 'Veuillez vérifier votre URL webhook.'}`, false);
        }
    } catch (error) {
        console.error('❌ Erreur complète:', error);
        showResult(`❌ Erreur de connexion: ${error.message}. Vérifiez votre URL webhook et votre connexion internet.`, false);
    }
}

// Envoi vers Make après traitement IA
async function sendToMake(data) {
    const webhookURL = 'https://hook.eu2.make.com/neigsfankcqam0rtz7qogp1wf0qmbt1f';
    await fetch(webhookURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
}

function showResult(message, isSuccess) {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = message;
    resultDiv.className = isSuccess ? 'success' : '';
    resultDiv.style.display = 'block';
    
    // Scroll vers le résultat
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Réinitialiser le formulaire si succès
    if (isSuccess) {
        setTimeout(() => {
            document.getElementById('pedagogicalForm').reset();
        }, 2000);
    }
}





