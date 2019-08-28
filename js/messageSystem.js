//Probably will not be used, system is simple enough to fit in one function
class MessageSystem {
  contsructor() {
    this._messageContainer = $('.messages');
  }

  displayMessage({ icon, text, title, options }) {
    const messageDom = $('<div>', { class: 'message' });

    const iconDom = $('<img>', {
      class: 'icon',
      src: '/img/messageIcons/' + icon + '.png'
    });

    const textContainerDom = $('<div>', { class: 'textContainer' });
    const titleDom = $('<h3>', { class: 'title' });
    const textDom = $('<p>', { class: 'text' });

    const optionsContainerDom = $('<div>', { class: 'optionsContainer' });
    const removeThisMessage = () => message.remove();
    addOption({ name: 'Ok', handler: removeThisMessage }}, optionsContainerDom);
    options.forEach(option => addOption(option, optionsContainerDom));

    messageDom.append(
      iconDom,
      textContainerDom,
      titleDom,
      textDom,
      optionsContainerDom
    );
    this._messageContainer.append(messageDom);
  }
}

function addOption(option, container) {
  const optionDom = $('<div>', {
    class: 'option',
    text: option.name,
    click: option.handler
  });

  container.append(optionDom);
}

const messageSystem = new MessageSystem();
export default messageSystem;
