const fs = require('fs');
const path = require('path');
const settings = require('../settings');

// =====================================================
// LOAD DATA
// =====================================================
function loadUserGroupData() {
    try {
        const dataPath = path.join(__dirname, '../data/userGroupData.json');

        if (!fs.existsSync(dataPath)) {
            const defaultData = {
                antibadword: {},
                antilink: {},
                welcome: {},
                goodbye: {},
                chatbot: {},
                warnings: {},
                sudo: [],
                subowners: [] // 🆕 Sub Owners
            };

            fs.writeFileSync(dataPath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }

        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        // ضمان وجود الحقول
        if (!data.sudo) data.sudo = [];
        if (!data.subowners) data.subowners = [];

        return data;

    } catch (error) {
        console.error('Error loading user group data:', error);
        return {
            antibadword: {},
            antilink: {},
            welcome: {},
            goodbye: {},
            chatbot: {},
            warnings: {},
            sudo: [],
            subowners: []
        };
    }
}

// =====================================================
// SAVE DATA
// =====================================================
function saveUserGroupData(data) {
    try {
        const dataPath = path.join(__dirname, '../data/userGroupData.json');

        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        return true;

    } catch (error) {
        console.error('Error saving user group data:', error);
        return false;
    }
}

// =====================================================
// OWNER SYSTEM
// =====================================================

// 👑 Owner (المالك الأساسي)
function isOwner(userId) {
    try {
        const ownerNumber = settings.ownerNumber;
        return userId === ownerNumber || userId.includes(ownerNumber);
    } catch (e) {
        return false;
    }
}

// 👥 Sub Owner check
async function isSubOwner(userId) {
    try {
        const data = loadUserGroupData();
        return data.subowners.includes(userId);
    } catch (error) {
        console.error('Error checking subowner:', error);
        return false;
    }
}

// ➕ Add Sub Owner
async function addSubOwner(userId) {
    try {
        const data = loadUserGroupData();

        if (!data.subowners.includes(userId)) {
            data.subowners.push(userId);
            saveUserGroupData(data);
        }

        return true;
    } catch (error) {
        console.error('Error adding subowner:', error);
        return false;
    }
}

// ➖ Remove Sub Owner
async function removeSubOwner(userId) {
    try {
        const data = loadUserGroupData();

        const index = data.subowners.indexOf(userId);
        if (index !== -1) {
            data.subowners.splice(index, 1);
            saveUserGroupData(data);
        }

        return true;
    } catch (error) {
        console.error('Error removing subowner:', error);
        return false;
    }
}

// 📋 Get Sub Owners List
async function getSubOwners() {
    try {
        const data = loadUserGroupData();
        return data.subowners;
    } catch (error) {
        return [];
    }
}

// =====================================================
// ANTILINK
// =====================================================
async function setAntilink(groupId, type, action) {
    try {
        const data = loadUserGroupData();

        if (!data.antilink) data.antilink = {};
        if (!data.antilink[groupId]) data.antilink[groupId] = {};

        data.antilink[groupId] = {
            enabled: type === 'on',
            action: action || 'delete'
        };

        saveUserGroupData(data);
        return true;

    } catch (error) {
        console.error(error);
        return false;
    }
}

async function getAntilink(groupId, type) {
    try {
        const data = loadUserGroupData();

        if (!data.antilink || !data.antilink[groupId]) return null;

        return type === 'on' ? data.antilink[groupId] : null;

    } catch (error) {
        return null;
    }
}

async function removeAntilink(groupId) {
    try {
        const data = loadUserGroupData();

        if (data.antilink && data.antilink[groupId]) {
            delete data.antilink[groupId];
            saveUserGroupData(data);
        }

        return true;
    } catch (error) {
        return false;
    }
}

// =====================================================
// SUDO SYSTEM
// =====================================================
async function isSudo(userId) {
    try {
        const data = loadUserGroupData();
        return data.sudo.includes(userId);
    } catch (error) {
        return false;
    }
}

async function addSudo(userId) {
    try {
        const data = loadUserGroupData();

        if (!data.sudo.includes(userId)) {
            data.sudo.push(userId);
            saveUserGroupData(data);
        }

        return true;
    } catch (error) {
        return false;
    }
}

async function removeSudo(userId) {
    try {
        const data = loadUserGroupData();

        const index = data.sudo.indexOf(userId);
        if (index !== -1) {
            data.sudo.splice(index, 1);
            saveUserGroupData(data);
        }

        return true;
    } catch (error) {
        return false;
    }
}

async function getSudoList() {
    try {
        const data = loadUserGroupData();
        return data.sudo;
    } catch (error) {
        return [];
    }
}

// =====================================================
// EXPORTS
// =====================================================
module.exports = {
    // Owner System
    isOwner,
    isSubOwner,
    addSubOwner,
    removeSubOwner,
    getSubOwners,

    // Sudo
    isSudo,
    addSudo,
    removeSudo,
    getSudoList,

    // Antilink
    setAntilink,
    getAntilink,
    removeAntilink
};