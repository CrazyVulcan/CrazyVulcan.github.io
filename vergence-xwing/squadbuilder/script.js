document.addEventListener('DOMContentLoaded', function() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => initializeBuilder(data))
        .catch(error => console.error('Error loading ship data:', error));
});

function initializeBuilder(data) {
    const shipSelect = document.getElementById('shipSelect');
    data.ships.forEach(ship => {
        const option = document.createElement('option');
        option.value = ship.name;
        option.textContent = ship.name;
        shipSelect.appendChild(option);
    });

    shipSelect.addEventListener('change', function() {
        const selectedShip = data.ships.find(ship => ship.name === this.value);
        const upgradeSlotsContainer = document.getElementById('upgradeSlots');
        upgradeSlotsContainer.innerHTML = ''; // Clear previous slots
        if (selectedShip) {
            selectedShip.upgradeSlots.forEach(slot => {
                const label = document.createElement('label');
                label.textContent = `${slot}: `;
                const select = document.createElement('select');
                data.upgrades[slot].forEach(upgrade => {
                    const option = document.createElement('option');
                    option.value = upgrade;
                    option.textContent = upgrade;
                    select.appendChild(option);
                });
                upgradeSlotsContainer.appendChild(label);
                upgradeSlotsContainer.appendChild(select);
            });
        }
    });
}