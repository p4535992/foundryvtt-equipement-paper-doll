export const CONSTANTS = {
    MODULE_ID: "equipment-paper-doll",
    PATH: "modules/equipment-paper-doll",
    FLAGS: {
        FLAGS: "flags",
        DATA: "data",
        PERSONAL_SETTINGS: "personalSettings",
    },
    INITIAL_SLOT_STRUCTURE: {
        back: ["", "", "", ""],
        cape: ["", "", "", ""],
        eyes: ["", "", "", ""],
        feet: ["", "", "", ""],
        hands: ["", "", "", ""],
        head: ["", "", "", ""],
        mainHand: ["", "", "", ""],
        neck: ["", "", "", ""],
        offHand: ["", "", "", ""],
        ring: ["", "", "", "", "", "", "", ""],
        torso: ["", "", "", ""],
        waist: ["", "", "", ""],
        wrists: ["", "", "", ""],
    },
    TATTOOS_SLOT_STRUCTURE: {
        tattooHandLeft: ["", "", "", ""],
        tattooHandRight: ["", "", "", ""],
        tattooFootLeft: ["", "", "", ""],
        tattooFootRight: ["", "", "", ""],
        tattooArmLeft: ["", "", "", ""],
        tattooArmRight: ["", "", "", ""],
        tattooLegLeft: ["", "", "", ""],
        tattooLegRight: ["", "", "", ""],
        tattooTorso: ["", "", "", "", "", "", "", ""],
        tattooBack: ["", "", "", "", "", "", "", ""],
        tattooScalp: ["", "", "", ""],
    },
};

export const tattoosRenderOrder = [
    "tattooScalp",
    "tattooArmLeft",
    "tattooArmRight",
    "tattooHandLeft",
    "tattooHandRight",
    "tattooTorso",
    "tattooBack",
    "tattooLegLeft",
    "tattooLegRight",
    "tattooFootLeft",
    "tattooFootRight",
];

export const shadowItemModifier = "__secondary";
export const itemEquippedPath = "data.equipped";

export const openSettingsButtonName = "Open Settings";
export const inventorySlotsStep = 72;
