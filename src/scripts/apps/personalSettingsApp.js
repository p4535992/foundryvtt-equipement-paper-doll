import { getSetting } from "../settings.js";
import itemSearchApp from "./itemSearchApp.js";
import { createHTMLElement } from "../lib/headerButtonCreater.js";
import { addBoxComponent, fillerElementComponent } from "../components/paperDollScreen.js";
import { slotNames, weaponSlotNames } from "../constants/slotNames.js";
import { CONSTANTS } from "../constants/constants.js";
import { personalSettingsAppData } from "../components/personalSettingsApp.js";
import {
    imagePathInputField,
    imageUrlInputField,
    nonFillerElements,
    slotsContainer,
} from "../constants/commonQuerries.js";
import { backgroundImage, fillerElementClass } from "../constants/objectClassNames.js";

/**
 * Returns a filler slot
 *
 * @returns {HTMLElement}
 */
const createFillerSlot = () => createHTMLElement(fillerElementComponent);

/**
 * Returns a button to equip a new item
 *
 * @param filteredItems {Item5e[]} - items that can be equipped on this slot
 * @param allItems {Item5e[]} - all items held by the owner actor
 * @param availableSlots {Number}
 * @param categoryName {String}
 * @returns {HTMLElement}
 */
const createButtonSlot = (filteredItems, allItems, availableSlots, categoryName) => {
    return createHTMLElement({
        ...addBoxComponent,
        events: {
            click: (event) =>
                new itemSearchApp(filteredItems, allItems, event, availableSlots, categoryName).render(true),
        },
    });
};

export default class personalSettingsApp extends FormApplication {
    constructor(sourceActor, filteredItems, allItems, slotStructure) {
        super();
        this.itemSlotNames = [...slotNames, ...weaponSlotNames];
        this.sourceActor = sourceActor;
        this.currentSlotSettings = sourceActor.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.PERSONAL_SETTINGS);
        this.filteredItems = filteredItems;
        this.allItems = allItems;
        this.slotStructure = slotStructure;
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            ...personalSettingsAppData,
            template: "modules/equipment-paper-doll/templates/personalSettingsApp.hbs",
        };
    }

    /**
     * Creates an array with the min/max/current/name value for each slot
     *
     * @returns {[{value: Number, min: 1, max: 4 or 8, current: Number}]}
     */
    constructItemsData() {
        const itemsData = [];
        this.itemSlotNames.forEach((slotName) => {
            const name = `${slotName}Slots`;
            const globalSettingsObject = {
                name: name,
                value: getSetting(name),
            };
            const current =
                this.currentSlotSettings?.filter((setting) => setting.name === name)[0] || globalSettingsObject;
            itemsData.push({
                ...current,
                min: 1,
                max: name === "ringSlots" ? 8 : 4,
            });
        });
        return itemsData;
    }

    getData(options) {
        return {
            items: this.constructItemsData(),
            imageUrl: this.currentSlotSettings?.filter?.((obj) => obj.name === "imageUrl")?.[0]?.value,
            image: this.currentSlotSettings?.filter?.((obj) => obj.name === "image")?.[0]?.value,
        };
    }

    /**
     * Updates the paper doll with the new slot numbers
     *
     * @param numberOfSlots {Number} - new number of slots
     * @param formName {String} - name of the slot type ex: "head", "eyes"
     */
    updatePaperDollView(numberOfSlots, formName) {
        const gridName = formName.slice(0, -5);
        const location = document.querySelector(slotsContainer(gridName));
        const unusableSlots = location.querySelectorAll(`.${fillerElementClass}`).length;
        const usableSlots = (gridName === "ring" ? 8 : 4) - unusableSlots;

        if (numberOfSlots < usableSlots) {
            //replace usable with filler
            this.slotStructure[gridName] = this.slotStructure[gridName].slice(0, numberOfSlots - usableSlots);
            const replaceableSlots = [...location.querySelectorAll(nonFillerElements)].slice(
                numberOfSlots,
                usableSlots,
            );
            replaceableSlots.forEach((slot) => slot?.parentNode.replaceChild(createFillerSlot(), slot));
        } else if (numberOfSlots > usableSlots) {
            //replace filler with usable
            this.slotStructure[gridName].push(...Array(numberOfSlots - usableSlots).fill(""));
            const replaceableSlots = [...location.querySelectorAll(`.${fillerElementClass}`)].slice(
                0,
                numberOfSlots - usableSlots,
            );
            replaceableSlots.forEach((slot) =>
                slot?.parentNode?.replaceChild?.(
                    createButtonSlot(this.filteredItems[gridName], this.allItems, this.slotStructure, gridName),
                    slot,
                ),
            );
        }
    }

    /**
     * Stores setting as flags on actor
     *
     * @param event
     * @param formData
     * @returns {Promise<void>}
     * @private
     */
    async _updateObject(event, formData) {
        const formattedFromData = [];
        Object.keys(formData).forEach((formName) => {
            if (formName === "img") {
                formattedFromData.push({
                    name: "image",
                    value: formData[formName],
                });
            } else if (formName === "imgUrl") {
                formattedFromData.push({
                    name: "imageUrl",
                    value: formData[formName],
                });
            } else {
                const globalSetting = getSetting(formName);
                this.updatePaperDollView(formData[formName], formName);

                if (formData[formName] === globalSetting) return;

                formattedFromData.push({
                    name: formName,
                    value: formData[formName],
                });
            }
        });
        await this.sourceActor.setFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.PERSONAL_SETTINGS, formattedFromData);
    }

    /**
     * Dynamically sets the background image of the equipment screen
     *
     * @param path {string}
     */
    setBackgroundImage(path) {
        const backgroundContainer = document.querySelector(`.${backgroundImage}`);
        backgroundContainer.style.background = `url(${path}) no-repeat center`;
        backgroundContainer.style["background-size"] = "contain";
    }

    createFilePicker(html) {
        html[0].querySelector(".imageBrowser").addEventListener("click", async (ev) => {
            await new FilePicker({
                type: "image",
                current: this.currentSlotSettings?.filter((obj) => obj.name === "image")?.[0]?.value || "",
                callback: (path) => {
                    const imageUrl = document.querySelector(imageUrlInputField);
                    if (imageUrl.value) this.setBackgroundImage(imageUrl.value);
                    else {
                        this.setBackgroundImage(`./${path}`);
                        document.querySelector(".imagePath").value = `./${path}`;
                    }
                },
            }).render(true);
        });
    }

    /**
     * Adds events to the path input fields
     *
     * @param html {HTMLElement}
     */
    addLinkEvents([html]) {
        const imagePath = html.querySelector(imagePathInputField);
        const imageUrl = html.querySelector(imageUrlInputField);

        imagePath.addEventListener("focusout", () => {
            if (imageUrl.value) return this.setBackgroundImage(imageUrl.value);

            this.setBackgroundImage(imagePath.value);
        });

        imageUrl.addEventListener("focusout", () => {
            if (imageUrl.value) return this.setBackgroundImage(imageUrl.value);
            if (imagePath.value) return this.setBackgroundImage(imagePath.value);

            const backgroundContainer = document.querySelector(`.${backgroundImage}`);
            backgroundContainer.style.background = ``;
        });
    }

    activateListeners(html) {
        this.createFilePicker(html);
        this.addLinkEvents(html);

        super.activateListeners(html);
    }
}
