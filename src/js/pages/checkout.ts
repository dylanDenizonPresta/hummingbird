/**
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import {Modal} from 'bootstrap';
import useProgressRing from '@js/components/useProgressRing';
import A11yHelpers from '@helpers/a11y';

const initCheckout = () => {
  const {prestashop} = window;
  const {Theme: {selectors, events}} = window;
  const {progressRing: ProgressRingMap, checkout: CheckoutMap} = selectors;
  const a11y = new A11yHelpers();
  const steps = document.querySelectorAll<HTMLElement>(CheckoutMap.steps.item);
  const actionButtons = document.querySelectorAll<HTMLElement>(CheckoutMap.actionsButtons);
  const {setProgress} = useProgressRing(ProgressRingMap.checkout.element, {steps: steps.length});
  const termsLink = document.querySelector<HTMLLinkElement>(CheckoutMap.termsLink);
  const termsModalElement = document.querySelector<HTMLLinkElement>(CheckoutMap.checkoutModal);

  // Only UI things, the real toggle is handled by Bootstrap Tabs
  // A thing we handle manually is the .active class on the toggling buttons
  const toggleStep = (content: HTMLElement, step?: HTMLElement) => {
    const currentContent = document.querySelector(CheckoutMap.steps.current);
    const currentButton = step?.querySelector<HTMLButtonElement>(CheckoutMap.steps.button);
    currentButton?.focus();
    currentContent?.classList.remove('step--current', 'js-current-step');

    if (step) {
      const responsiveStep = document.querySelector<HTMLElement>(CheckoutMap.steps.specificStep(step.dataset.step));
      const shownResponsiveStep = document.querySelector<HTMLElement>(CheckoutMap.steps.shownResponsiveStep);

      shownResponsiveStep?.classList.add('d-none');
      responsiveStep?.classList.remove('d-none');
    }

    content.classList.add('js-current-step', 'step--current');
  };

  actionButtons.forEach((button) => {
    const stepContent = document.querySelector<HTMLElement>(
      CheckoutMap.steps.specificStepContent(button.dataset.step),
    );

    button.addEventListener('click', (event) => {
      event.preventDefault();
      const triggerEl = document.querySelector<HTMLButtonElement>(
        CheckoutMap.steps.backButton(button.dataset.step),
      );

      if (stepContent && triggerEl) {
        // Click on the corresponding tab
        triggerEl.click();
        toggleStep(stepContent);
      }
    });
  });

  // Initial step settings
  steps.forEach((step, index) => {
    // Get step content
    const stepContent = document.querySelector<HTMLElement>(
      CheckoutMap.steps.specificStepContent(step.dataset.step),
    );

    // Get step selector button (toggler)
    const stepButton = step.querySelector<HTMLButtonElement>('button');

    if (stepContent) {
      // If step is finished, we mark it green
      if (stepContent.classList.contains('step--complete')) {
        step.classList.add('checkout-steps__step--success');
      }

      // Current step will get an active property
      if (stepContent.classList.contains('step--current')) {
        step.classList.add('checkout-steps__step--current');
        stepButton?.classList.add('active');
        const responsiveStep = document.querySelector<HTMLElement>(
          CheckoutMap.steps.specificStep(step.dataset.step),
        );
        const shownResponsiveStep = document.querySelector<HTMLElement>(CheckoutMap.steps.shownResponsiveStep);

        shownResponsiveStep?.classList.add('d-none');
        responsiveStep?.classList.remove('d-none');

        if (setProgress) {
          setProgress(index + 1);
        }
      } else {
        stepButton?.classList.remove('active');
      }

      // If the step can be navigated
      if (stepContent.classList.contains('step--reachable')) {
        stepButton?.addEventListener('click', () => {
          if (setProgress) {
            setProgress(index + 1);
          }

          toggleStep(stepContent, step);
        });
      }

      // If the step is not finished yet, we disable the navigator
      if (stepContent.classList.contains('step--unreachable')) {
        stepButton?.setAttribute('disabled', 'true');
        stepButton?.addEventListener('click', () => {
          toggleStep(stepContent, step);
        });
      }
    }
  });

  termsLink?.addEventListener('click', (event) => {
    event.preventDefault();
    a11y.storeFocus();

    if (termsModalElement) {
      const termsModal = new Modal(termsModalElement);
      const linkElement = event.target as HTMLLinkElement;
      let url = linkElement.getAttribute('href');

      if (url) {
        url += '?content_only=1';

        (async () => {
          try {
            const response = await fetch(url);
            const content = await response.text();
            const contentElement = document.createElement('div');
            contentElement.innerHTML = content;
            const modalBody = termsModalElement.querySelector(selectors.modalBody);
            const sanitizedContent = contentElement.querySelector(selectors.pageCms);

            if (sanitizedContent && modalBody) {
              modalBody.innerHTML = sanitizedContent.innerHTML;

              termsModal.show();
            }
          } catch (e) {
            prestashop.emit(events.handleError, {eventType: 'clickOnTermsLink', error: e});
          }
        })();
      }
    }
  });

  // Restore focus when terms modal is closed
  termsModalElement?.addEventListener('hidden.bs.modal', () => {
    a11y.restoreFocus();
  });

  // Prestashop event triggers after selecting different carrier
  prestashop.on(events.updatedDeliveryForm, (params: Theme.DeliveryOptionForm.DeliveryOptionItem): void => {
    const selectedOption = params.deliveryOption?.[0];

    if (!selectedOption) return;

    const selectedWrapper = selectedOption.querySelector(CheckoutMap.carrierExtraContentWrapper);

    if (!(selectedWrapper instanceof HTMLElement)) return;

    const allWrappers = document.querySelectorAll(CheckoutMap.carrierExtraContentWrapper);

    // Reset all wrappers
    allWrappers.forEach((wrapper: HTMLElement) => {
      wrapper.removeAttribute('data-active');
    });

    // Activate the selected wrapper
    selectedWrapper.setAttribute('data-active', '');
  });
  
  // Détecter si on est en mode checkout en une page
  const isOnePageCheckout = document.querySelector('#one-page-checkout') !== null || 
                             document.querySelector('.checkout-one-page__steps--merged') !== null;

  // Fonction pour mettre à jour dynamiquement les options de livraison
  // quand l'adresse change dans le one-page checkout
  const updateDeliveryOptionsOnAddressChange = () => {
    if (!isOnePageCheckout) {
      return; // Ne rien faire si le one-page checkout n'est pas activé
    }

    // Utiliser la délégation d'événements pour capturer les changements
    const handleAddressChange = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      
      // Vérifier que c'est bien un radio button pour l'adresse de livraison
      if (target.type !== 'radio' || target.name !== 'id_address_delivery') {
        return;
      }

      const idAddressDelivery = target.value;

      if (!idAddressDelivery) {
        return;
      }

      // Trouver l'étape de livraison
      const deliveryStep = document.querySelector<HTMLElement>('#checkout-delivery-step');
      
      if (!deliveryStep) {
        return;
      }

      // Afficher un indicateur de chargement
      deliveryStep.style.opacity = '0.5';
      deliveryStep.style.pointerEvents = 'none';

      try {
        // Appel AJAX pour mettre à jour les options de livraison
        const formData = new FormData();
        formData.append('ajax', '1');
        formData.append('action', 'getDeliveryOptions');
        formData.append('id_address_delivery', idAddressDelivery);

        const response = await fetch(prestashop.urls.pages.order, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        const json = JSON.parse(data);
        // Mettre à jour le HTML de l'étape de livraison
        const deliveryContent = deliveryStep.querySelector('.delivery-options__container');
        if (deliveryContent) {
          deliveryContent.innerHTML = json.html;
        } else {
          // Si le conteneur n'existe pas, mettre à jour toute l'étape
          const parser = new DOMParser();
          const doc = parser.parseFromString(data, 'text/html');
          const newContent = doc.querySelector('.delivery-options__container') || doc.body;
          if (newContent) {
            deliveryStep.innerHTML = newContent.innerHTML;
          }
        }

        deliveryStep.style.opacity = '1';
        deliveryStep.style.pointerEvents = 'auto';

        // Émettre l'événement PrestaShop pour mettre à jour les options de livraison
        prestashop.emit(events.updatedDeliveryForm, {
          deliveryOption: [deliveryStep],
        });
      } catch (error) {
        console.error('Erreur lors du chargement des options de livraison:', error);
        deliveryStep.style.opacity = '1';
        deliveryStep.style.pointerEvents = 'auto';
        
        prestashop.emit(events.handleError, {
          eventType: 'updateDeliveryOptions',
          error,
        });
      }
    };

    // Utiliser la délégation d'événements sur le document pour capturer les changements
    document.addEventListener('change', handleAddressChange);

    // Réinitialiser après les mises à jour AJAX du DOM
    const observer = new MutationObserver(() => {
      // Les événements sont déjà attachés via la délégation, pas besoin de réinitialiser
    });

    const addressesContainer = document.querySelector('#delivery-addresses, .js-address-selector');
    if (addressesContainer) {
      observer.observe(addressesContainer, {
        childList: true,
        subtree: true,
      });
    }
  };

  // Initialiser l'écoute des changements d'adresse si on est en mode one-page checkout
  if (isOnePageCheckout) {
    updateDeliveryOptionsOnAddressChange();
  }

};

export default initCheckout;
