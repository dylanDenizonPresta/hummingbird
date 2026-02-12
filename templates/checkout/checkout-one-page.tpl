{**
 * One-page checkout: all 4 steps merged on a single page
 * Used when $is_one_page_checkout_enabled is true
 *}

{block name='checkout_notifications'}
  {include file='_partials/notifications.tpl'}
{/block}

{* Style pour forcer toutes les étapes à être visibles dès le début *}
<style>
  {* Forcer toutes les étapes à être visibles - règles très spécifiques pour surcharger Bootstrap *}
  #one-page-checkout .checkout-one-page__steps--merged .step,
  .checkout-one-page__steps--merged .step,
  .checkout-one-page__steps--merged section.step {
    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
    height: auto !important;
    overflow: visible !important;
    max-height: none !important;
  }
  
  {* Surcharger toutes les variantes de classes Bootstrap *}
  .checkout-one-page__steps--merged .step.tab-pane,
  .checkout-one-page__steps--merged .step.collapse,
  .checkout-one-page__steps--merged .step.tab-pane.collapse,
  .checkout-one-page__steps--merged .step.collapse:not(.show),
  .checkout-one-page__steps--merged .step.tab-pane:not(.active),
  .checkout-one-page__steps--merged .step[role="tabpanel"] {
    display: block !important;
    visibility: visible !important;
    height: auto !important;
    opacity: 1 !important;
    max-height: none !important;
  }
  
  {* Forcer la visibilité même avec la classe show *}
  .checkout-one-page__steps--merged .step.collapse.show,
  .checkout-one-page__steps--merged .step.tab-pane.active {
    display: block !important;
    visibility: visible !important;
    height: auto !important;
  }
  
  {* Uniformiser les titres des étapes *}
  .checkout-one-page__steps--merged .step__title h1,
  .checkout-one-page__steps--merged .step__title p {
    margin-block-end: 1rem;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  {* Espacement et séparation entre les étapes *}
  .checkout-one-page__steps--merged .step {
    margin-block-end: 3rem;
    padding-block-end: 2rem;
    border-block-end: 1px solid var(--bs-border-color);
  }
  
  .checkout-one-page__steps--merged .step:last-child {
    border-block-end: none;
    margin-block-end: 0;
  }
  
  {* Masquer les boutons "Retour" dans le checkout fusionné *}
  .checkout-one-page__steps--merged .js-back {
    display: none !important;
  }
  
  {* Adapter les boutons "Continuer" *}
  .checkout-one-page__steps--merged .buttons-wrapper--split {
    justify-content: flex-end;
  }
  
  {* S'assurer que le conteneur tab-content n'interfère pas *}
  .checkout-one-page__steps--merged.tab-content .tab-pane,
  .checkout-one-page__steps--merged .tab-content .tab-pane {
    display: block !important;
  }
  
  {* Empêcher Bootstrap de cacher les étapes via les media queries *}
  @media (prefers-reduced-motion: no-preference) {
    .checkout-one-page__steps--merged .step.collapse {
      transition: none !important;
    }
  }
</style>

{* Script pour forcer toutes les étapes à rester visibles *}
<script>
  (function() {
    // Fonction pour rendre toutes les étapes visibles
    function showAllSteps() {
      const steps = document.querySelectorAll('.checkout-one-page__steps--merged .step');
      steps.forEach(function(step) {
        step.classList.add('show', 'active');
        step.style.display = 'block';
        step.style.visibility = 'visible';
        step.style.height = 'auto';
        step.style.opacity = '1';
        step.style.overflow = 'visible';
      });
    }
    
    // Exécuter immédiatement si le DOM est déjà chargé
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showAllSteps);
    } else {
      showAllSteps();
    }
    
    // Surveiller les changements pour maintenir la visibilité
    const observer = new MutationObserver(function(mutations) {
      const steps = document.querySelectorAll('.checkout-one-page__steps--merged .step');
      steps.forEach(function(step) {
        if (!step.classList.contains('show') || step.style.display === 'none') {
          step.classList.add('show', 'active');
          step.style.display = 'block';
          step.style.visibility = 'visible';
          step.style.height = 'auto';
          step.style.opacity = '1';
        }
      });
    });
    
    // Observer les changements dans le conteneur des étapes
    const stepsContainer = document.querySelector('.checkout-one-page__steps--merged');
    if (stepsContainer) {
      observer.observe(stepsContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }
    
    // Réexécuter après un court délai pour s'assurer que tout est chargé
    setTimeout(showAllSteps, 100);
    setTimeout(showAllSteps, 500);
  })();
</script>

<div class="columns-container container checkout-one-page" id="one-page-checkout">
  <div id="center-column" class="center-column page page--full-width">
    <div class="checkout-grid row">
      <div class="checkout-grid__content col-lg-8">
        <div class="checkout-one-page__steps checkout-one-page__steps--merged" id="opc-enabled">
          {block name='checkout_process'}
            {* Utiliser le système de rendu existant mais forcer toutes les étapes à être visibles *}
            
            {render file='checkout/checkout-process.tpl' ui=$checkout_process}
          {/block}
        </div>
      </div>

      <div class="checkout-grid__aside col-lg-4">
        <div class="checkout-grid__aside-wrapper">
          <div class="checkout__summary-accordion accordion">
            <div class="checkout__summary-accordion-item accordion-item">
              <div class="checkout__summary-accordion-header accordion-header">
                <button class="accordion-button" type="button" data-bs-target="#js-checkout-summary" data-bs-toggle="collapse" aria-expanded="true">
                  {l s='Order summary' d='Shop.Theme.Checkout'}
                </button>
              </div>
              {block name='cart_summary'}
                <div class="checkout__summary-accordion-wrapper cart-summary js-checkout-summary">
                  {include file='checkout/_partials/cart-summary.tpl' cart=$cart}
                </div>
              {/block}
            </div>
          </div>
          {hook h='displayReassurance'}
        </div>
      </div>
    </div>
  </div>
</div>

{include file='checkout/_partials/modal-terms.tpl'}
