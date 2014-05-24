<div class="product-form">
  <div class="basic">
    <?php print drupal_render($form['name']); ?>
  </div>
  <div class="details">
    <?php print drupal_render_children($form); ?>
  </div>
</div>
