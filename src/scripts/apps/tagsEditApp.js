import { extractFlags, extractFlagsFromItemName } from "../lib/flagUtils.js";
import { createHTMLElement } from "../lib/headerButtonCreater.js";
import { CONSTANTS } from "../constants/constants.js";
import { flagComponent, tagsEditAppData } from "../components/tagsEditApp.js";
import { addFlagButton, flagTitle, removeFlagButtonClass } from "../constants/objectClassNames.js";
import { allSlots } from "../constants/slotNames.js";

export default class TagsEditApp extends FormApplication {
    currentFlags;
    item;

    constructor(item) {
        super();
        this.currentFlags = new Set(
            Array.isArray(item.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.FLAGS))
                ? item.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.FLAGS)
                : [],
        );
        this.item = item;
        if (this.currentFlags.size === 0) this.addExtractedFlags();
    }

    /**
     * Extracts flags from attributes and item name
     */
    addExtractedFlags() {
        [...extractFlags(this.item), ...extractFlagsFromItemName(this.item)].forEach((flag) =>
            this.currentFlags.add(flag),
        );
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            ...tagsEditAppData,
            template: "modules/equipment-paper-doll/templates/tagsEditApp.hbs",
        };
    }

    getData(options) {
        return {
            currentFlags: [...this.currentFlags],
            availableSlots: allSlots,
        };
    }

    /**
     * Checks if this flag already has this specific slot
     *
     * @param newFlagContent {String}
     * @param lastFlagContent {String}
     * @returns {Boolean}
     */
    slotAlreadyExitsInFlag(newFlagContent, lastFlagContent) {
        return lastFlagContent.includes(newFlagContent.split("-")[1]);
    }

    /**
     * If the add as secondary checkbox is checked this method modifies the current flag
     *
     * @param newFlagContent {String}
     */
    handleSecondaryFlags(newFlagContent) {
        const flagsContainer = this.form.querySelector(".tagsEditApp__flag-container");
        const lastFlag = flagsContainer.children[flagsContainer.children.length - 1];
        const lastFlagTitle = lastFlag.querySelector(`.${flagTitle}`);
        const lastFlagInData = Array.from(this.currentFlags).pop();

        if (this.slotAlreadyExitsInFlag(newFlagContent, lastFlagInData)) return;

        this.currentFlags.delete(lastFlagInData);
        this.currentFlags.add(`${lastFlagInData}, ${newFlagContent}`);
        this.item.setFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.FLAGS, [...this.currentFlags]);
        lastFlagTitle.innerText += `, ${newFlagContent}`;
    }

    /**
     * Adds all the flags to the items flag list
     *
     * @param event
     * @param formData
     * @returns {Promise<void>}
     * @private
     */
    async _updateObject(event, formData) {
        if (event.submitter.classList.value === addFlagButton) {
            const newFlag = `${formData["number-input"]}-${formData["slot-type"]}`;

            if (formData["as-secondary"]) return this.handleSecondaryFlags(newFlag);

            const newFlagWrapper = createHTMLElement(flagComponent(newFlag));
            if (!this.currentFlags.has(newFlag))
                this.form.querySelector(".tagsEditApp__flag-container").appendChild(newFlagWrapper);

            this.currentFlags.add(newFlag);
            this.item.setFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.FLAGS, [...this.currentFlags]);
        } else if (event.submitter.classList.value === removeFlagButtonClass) {
            this.currentFlags.delete(event.submitter.id);
            event.submitter.parentElement.remove();
            this.item.setFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.FLAGS, [...this.currentFlags]);
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}
