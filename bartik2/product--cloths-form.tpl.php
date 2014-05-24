<div class="product-form cloths">
  <div class="basic">
    <?php print drupal_render($form['name']); ?>
    <?php print drupal_render($form['gender']); ?>
  </div>
  <div class="details">
    <?php print drupal_render_children($form); ?>
  </div>
</div>
