import {filterActorItems, filterEquipableItems} from "../lib/itemFiltering.js"
import {registerHelpers} from "../lib/handlebarsHelpers.js";
import {getItemsSlotArray} from "../settings.js";
import {createImageTile} from "../lib/imageTile.js";
import personalSettingsApp from "./personalSettingsApp.js";
import {slotNames, weaponSlotNames} from "../../constants/slotNames.js";
import {extractFlags} from "../lib/flagsExtracter.js";
import itemSearchApp from "./itemSearchApp.js";
import {createHeaderButton, createHTMLElement, insertBefore} from "../lib/headerButtonCreater.js";
import {
  flagFields,
  initialSlotStructure,
  moduleName, openSettingsButtonName,
  shadowItemModifier
} from "../contants/constants.js";
import {availableSlots, everythingInGrid, primaryItems, secondaryItems} from "../contants/commonQuerries.js";
import {addBoxClass, addedItemClass, backgroundImage} from "../contants/objectClassNames.js";
import {addBoxComponent, paperDollWindowData, rightClickMenuComponent} from "../components/paperDollScreen.js";

const getBackgroundImageFromActorFlags = (sourceActor) => {
  return sourceActor.getFlag(moduleName, flagFields.personalSettings)?.filter(obj => obj.name === 'image')?.[0]?.value;
}

export default class PaperDollApp extends FormApplication {
  constructor(sourceActor) {
    super();
    this.sourceActor = sourceActor;
    this.items = isNewerVersion(game.data.version, "0.7.0") ? sourceActor.items : sourceActor.items.entries;
    this.selectedItems = this.sourceActor.getFlag(moduleName, flagFields.data) ?? initialSlotStructure;
    this.equipableItems = filterEquipableItems(this.items);
    this.filteredItems = filterActorItems(this.items);

    this.flagEquippedItems()
    this.getSlotsStructure()
  }

  flagEquippedItems() {
    [...this.items].forEach((item) => {
        if (Array.isArray(item.getFlag(moduleName, flagFields.flags))) return

        item.setFlag(moduleName, flagFields.flags, extractFlags(item))
      }
    )
  }

  static get defaultOptions() {
    registerHelpers()
    return {
      ...super.defaultOptions,
      ...paperDollWindowData,
      template: "modules/Equipment-Paper-Doll/templates/paperDollApp.hbs",
    }
  }

  getData(options) {
    return {
      selectedItems: this.selectedItems,
      itemTypes: {
        types: slotNames,
        slots: getItemsSlotArray(slotNames, this.sourceActor)
      },
      items: {...this.filteredItems},
      weaponsTypes: {
        types: weaponSlotNames,
        slots: getItemsSlotArray(weaponSlotNames, this.sourceActor)
      },
    }
  }

  getSlotsStructure() {
    const itemSlotsArray = getItemsSlotArray(slotNames, this.sourceActor)
    const weaponSlotsArray = getItemsSlotArray(weaponSlotNames, this.sourceActor)
    if (this.selectedItems) {
      this.slotStructure = JSON.parse(JSON.stringify(this.selectedItems))
      slotNames.forEach((slot, index) => {
        this.slotStructure[slot].splice(1, this.slotStructure[slot].length - itemSlotsArray[index])
      })
      weaponSlotNames.forEach((slot, index) => {
        this.slotStructure[slot].splice(1, this.slotStructure[slot].length - weaponSlotsArray[index])
      })
    }

  }

  /**
   * Extracts the ids of the equipped items
   *
   * @returns { Array<object> }
   * @exampleObject {head: [ids of all equipped items]}
   */
  extractDataFromForm() {
    const divStructureArray = [...document.querySelectorAll(primaryItems),
      ...document.querySelectorAll(secondaryItems)];
    const formData = {};
    divStructureArray.forEach((element) => {
      const dataPoints = [...element.lastElementChild.children];
      const fieldData = [];

      dataPoints.forEach(point => {
        if (point.id !== 'tooltip') fieldData.push(point.id)
      });
      formData[element.id] = fieldData;
    })

    return formData;
  }

  /**
   * On loading the app replaces the button tiles with the imageTiles of items that are saved
   *
   * @param html - app html
   * @param storedItems - object that contains lists of what items ids are on each slot
   * @param actorItems - all items from the actor
   */
  replaceWithStoredItems(html, storedItems, actorItems) {
    if (!storedItems) return;

    Object.keys(storedItems).forEach((itemType) => {
      const slotsArray = html.querySelectorAll(availableSlots(itemType));
      storedItems[itemType].forEach((itemSlot, index) => {
        if (itemSlot === '') return;

        if (itemSlot.includes(shadowItemModifier)) {
          const itemId = itemSlot.split(shadowItemModifier)[0]
          const item = actorItems.find(localItem => localItem.data._id === itemId);
          createImageTile(item, slotsArray[index], true)
        } else {
          const item = actorItems.find(localItem => localItem.data._id === itemSlot);
          createImageTile(item, slotsArray[index])
        }

      })
    })
  }

  /**
   * Method called on submit, saves the stored items as a flag on the actor
   *
   * @param event - submit event
   * @param formData - form data returned by the submit event, it get overwritten, idk why I need it
   * @private
   */
  async _updateObject(event, formData) {
    formData = this.extractDataFromForm();

    await this.sourceActor.setFlag(moduleName, flagFields.data, formData)
  }

  /**
   * Renders the search window
   *
   * @param source - event that caused the render
   * @param selectedItems - items that match the slot filter
   * @param allItems - all equipable items
   */
  renderSearchWindow(source, selectedItems, allItems) {
    const location = source.currentTarget.parentNode.parentNode;
    let availableSlots;
    if (weaponSlotNames.includes(location.id)) {
      availableSlots = this.slotStructure.offHand.filter((el) => el === '').length
      availableSlots += this.slotStructure.mainHand.filter((el) => el === '').length
    } else  {
      availableSlots = this.slotStructure[location.id].filter((el) => el === '').length
    }
    new itemSearchApp(selectedItems[location.id], allItems, source, availableSlots, location.id).render(true);
  }

  removeElementAndSecondaries(element, itemToRemove) {
    const isTooltip = element.nodeName === 'SPAN' && element.id === 'tooltip'
    const isItemTooltip = element.className === `${itemToRemove.id}`
    const isShadowItemTooltip = element.className === `${itemToRemove.id}${shadowItemModifier}`
    const isShadowItem = element.nodeName === 'DIV' && element.id === `${itemToRemove.id}${shadowItemModifier}` && element.className === addedItemClass

    if (isTooltip && ( isShadowItemTooltip || isItemTooltip )) element.remove();

    if (isShadowItem) {
      let box = createHTMLElement({
        ...addBoxComponent,
        events: {
          click: (source) => this.renderSearchWindow(source, this.filteredItems, this.equipableItems)
        }
      })

      element.parentNode.replaceChild(box, element);
    }
  }

  getAvailableSlotsAtLocation(location) {
    return [...document.querySelectorAll(everythingInGrid(location))]
  }

  /**
   * Replaces an image tile with an empty slot
   *
   * @param item - item to be removed
   */
  unEquipItem([item]) {
    const slotName = item.parentElement.parentElement.id
    const itemId = item.id
    const addBox = createHTMLElement({
      ...addBoxComponent,
      events: {
        click: (source) => this.renderSearchWindow(source, this.filteredItems, this.equipableItems),
      }
    })
    let removeSources;

    if (weaponSlotNames.includes(slotName)) {
      removeSources = [...this.getAvailableSlotsAtLocation(weaponSlotNames[0]),
        ...this.getAvailableSlotsAtLocation(weaponSlotNames[1])]
    } else {
      removeSources = Array.from(item.parentElement.children)
    }

    removeSources.forEach((element) => this.removeElementAndSecondaries(element, item))
    item.replaceWith(addBox);

    document.querySelector('.hidden-submit').click()

    this.slotStructure[slotName] = this.slotStructure[slotName]
      .map((slot) => slot === itemId || slot === `${itemId}${shadowItemModifier}` ? '' : slot)
  }

  /**
   * Creates a context menu in a given app
   *
   * @param html - app
   */
  createNewContextMenu(html) {
    new ContextMenu(html, `.${addedItemClass}`, [{
      ...rightClickMenuComponent,
      callback: this.unEquipItem.bind(this)
    }])
  }

  setBackgroundImage(html) {
    const backgroundContainer = html.querySelector(`.${backgroundImage}`);
    const path = getBackgroundImageFromActorFlags(this.sourceActor);
    if (!path) return;

    backgroundContainer.style.background = `url(./${path}) no-repeat center`
    backgroundContainer.style['background-size'] = 'contain'
  }

  /**
   * Adds the button that opens the personal settings screen
   * Only creates the button if the user is a GM
   *
   * @param html - app
   */
  openPersonalSettings(html) {
    if (!game.user.isGM) return;

    const lastButton = html.parentNode.parentNode.firstElementChild.lastElementChild;
    const openSettingsButton = createHeaderButton(openSettingsButtonName)
    openSettingsButton.addEventListener('click', () => {
      new personalSettingsApp(this.sourceActor, this.filteredItems, this.equipableItems).render(true);
    })
    insertBefore(lastButton, openSettingsButton);
  }

  activateListeners(html) {
    this.setBackgroundImage(html[0]);
    const addBoxes = html[0].querySelectorAll(`.${addBoxClass}`);
    addBoxes.forEach((box) => box.addEventListener('click', (source) => {
      this.renderSearchWindow(source, this.filteredItems, this.equipableItems)
    }))

    this.replaceWithStoredItems(html[0], this.selectedItems, this.items)
    this.openPersonalSettings(html[0]);
    this.createNewContextMenu(html);
    super.activateListeners(html);
  }
}