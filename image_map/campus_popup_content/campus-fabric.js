
var campus_canvas = null;

function CampusCanvas(id) {
  this.polygon = null;
  this.first = null;
  this.current_points = [];
  this.canvas = new fabric.Canvas(id);
  this.canvas.setBackgroundImage(
    Drupal.settings.campus_canvas.src,
    this.canvas.renderAll.bind(this.canvas)
  );
  this.nodes = Drupal.settings.campus_canvas.nodes;
  this.nid = Drupal.settings.campus_canvas.nid;
 

  this.mode = CampusCanvas.view_config;
  this.load_state();
  this.toggle_mode = this.edit_mode;

  this.polygon_button = 
    jQuery('.field-name-field-map.field-type-image button[name="polygon"]');
  this.mode_button = 
    jQuery('.field-name-field-map.field-type-image button[name="mode"]');
  this.view_mode();
}

(function($) {
  $(document).ready(function () {

    campus_canvas = new CampusCanvas('campus-canvas-image');

    campus_canvas.canvas.on('mouse:down', function(e){
      campus_canvas.addPoint(e);
    });

    campus_canvas.canvas.on('mouse:over', function(e){
      e.target.setOpacity(campus_canvas.mode.opacity_over);
      campus_canvas.canvas.renderAll();
    });
    
    campus_canvas.canvas.on('mouse:out', function(e){
      e.target.setOpacity(campus_canvas.mode.opacity_out);
      campus_canvas.canvas.renderAll();
    });

 
    campus_canvas.canvas.on('object:selected', function(e){
      if (campus_canvas.polygon != null || campus_canvas.first != null) {
        return;
      }
      campus_canvas.polygon_button.text('edit region');
      campus_canvas.selected_region = e.target;
    });

    campus_canvas.canvas.on('selection:cleared', function(e){
      campus_canvas.polygon_button.text('add region');
      campus_canvas.selected_region = null;
    });

    campus_canvas.polygon_button.click(
      function(e) {
        if (campus_canvas.selected_region != null) {
          var nid = campus_canvas.selected_region.nid;
          campus_canvas.suggestion_list.children('select').val(nid);       
        }
        else if(campus_canvas.polygon == null) {
          window.alert('no region is selected');
          return;
        }
        campus_canvas.suggestion_list.dialog('open');
      }
    );

    campus_canvas.mode_button.click(function(e) {
      campus_canvas.toggle_mode();
    });
    
    $('.field-name-field-map.field-type-image button[name="save"]').click(
      function() {
        campus_canvas.save_state();
      }
    );
    $('.field-name-field-map.field-type-image button[name="clear"]').click(function(e) {
      campus_canvas.clear_state();
    });
    campus_canvas.suggestion_list = $('#suggestion-list');
    campus_canvas.suggestion_list.dialog({
        autoOpen : false,
        modal: true,
        title: 'Choose item for selected region',
        open: function(event, ui) {
	  $('.ui-dialog-titlebar button.ui-dialog-titlebar-close').text('X');
        },
        buttons:{
          Confirm: 
            function() { 
              $(this).dialog('close'); campus_canvas.add_polygon(); 
            },
          Open: 
            function() { 
              $(this).dialog('close'); campus_canvas.open_content(); 
            },
          Delete: 
            function() { 
              $(this).dialog('close'); campus_canvas.delete_polygon(); 
            }
        },
    });
    campus_canvas.popup = $('#campus-popup');
    campus_canvas.popup.dialog({
      autoOpen: false,
      modal: true,
      width: '50%',
      height: 'auto',
      open: function(event, ui) {
        $('.ui-dialog-titlebar button.ui-dialog-titlebar-close').text('X');
      },
    });
  });


})(jQuery);

CampusCanvas.prototype.delete_polygon = function() {
  if (this.selected_region != null) {
    this.selected_region.remove();
  }
  else if (this.polygon != null) {
    this.polygon.remove();
    this.polygon = null;
    this.first = null;
    this.current_points = [];
  }
};

CampusCanvas.prototype.add_polygon = function() {
  if (this.selected_region != null) {
    this.selected_region.nid = this.suggestion_list.children('select').val();
    return;
  }
  if (this.current_points.length < 3) {
    window.alert('at least three points required to create region');
    return;
  }
  this.polygon.remove();
  this.polygon = null;
  this.first = null;

  var options = {
    stroke: 'red',
    fill: 'black',
    opacity: 0.5,
    perPixelTargetFind: true,
  };
  var new_polygon = new fabric.Polygon(this.current_points, options);
  new_polygon.nid = this.suggestion_list.children('select').val();
  this.canvas.add(new_polygon);
  this.current_points = [];
};

CampusCanvas.prototype.addPoint = function(options) {
  if (typeof(options.target) === 'object') {
    if (this.mode.name == 'view') {
      this.selected_region = options.target;
      this.open_content();
      this.selected_region = null;
      return;
    }
    // don't start new polygon inside another
    if (this.polygon == null && this.first == null) {
      return;
    }
  }
  if (this.mode.name == 'view') {
    return;
  }
  var point = this.canvas.getPointer(options.e);
  this.current_points.push({x:point.x, y:point.y});
  if (this.polygon == null) {
    if (this.first == null) {
      this.polygon_button.text('add region');
      this.first = point;
    }
    else {
      var points = [ this.first, point ];
      var options = {
        stroke: 'red',
        fill: 'black',
        opacity: 1,
        selectable: false,
        perPixelTargetFind: true,
      };
      this.polygon = new fabric.Polygon(points, options);
      this.polygon.nid = null;
      this.canvas.add(this.polygon);
    }
  }
  else {
    point.x -= (this.polygon.minX + this.polygon.width / 2);
    point.y -= (this.polygon.minY + this.polygon.height / 2);
    this.polygon.points.push(point);
  }
  this.canvas.renderAll();
};

CampusCanvas.prototype.open_content = function() {
  var nid = this.selected_region.nid;
  if (this.nodes[nid].type == 'animal') {
    var url = Drupal.settings.basePath + 'popup/' + nid;
      campus_canvas.popup.dialog('open');
      campus_canvas.popup.html('loading ...');
    jQuery.get(url, function(data) {
      campus_canvas.popup.dialog('option', 'title', data.title);
      campus_canvas.popup.html(data.node);
    });
  }
  else {
    var url = Drupal.settings.basePath + 'node/' + nid;
    window.location.href = url;
  }
}

CampusCanvas.view_config = {
  name: 'view',
  opacity_over: 0.3,
  opacity_out: 0.01,
};

CampusCanvas.edit_config = {
  name: 'edit',
  opacity_over: 0.5,
  opacity_out: 0.2,
};

CampusCanvas.prototype.view_mode = function() {
  this.mode = CampusCanvas.view_config;
  this.canvas.forEachObject(function(obj) {
    obj.selectable = false;
    obj.setFill('#000');
    obj.setOpacity(CampusCanvas.view_config.opacity_out);
    obj.setStroke(null);
    obj.perPixelTargetFind = true;
  });
  if (this.polygon_button.length > 0) {
    this.polygon_button.attr('disabled', 'disabled');
    this.mode_button.text('edit');
    this.toggle_mode = this.edit_mode;
  }
  this.canvas.renderAll();
};

CampusCanvas.prototype.edit_mode = function() {
  this.mode = CampusCanvas.edit_config;
  this.canvas.forEachObject(function(obj) {
    obj.selectable = true;
    obj.setOpacity(CampusCanvas.edit_config.opacity_out);
    obj.setStroke('red');
    obj.perPixelTargetFind = true;
  });
  this.polygon_button.removeAttr('disabled');
  this.mode_button.text('view');
  this.toggle_mode = this.view_mode;
  this.canvas.renderAll();
};

CampusCanvas.prototype.save_state = function() {
  var points = JSON.stringify(this.canvas);

  var objects = this.canvas.getObjects();
  var nids = [];
  for (i=0; i<objects.length; i++) {
    nids[i] = objects[i].nid;
  }
  nids = JSON.stringify(nids);

  var canvas_data = {canvas: points, nids: nids};
  canvas_data = JSON.stringify(canvas_data);
  var url = Drupal.settings.basePath + 'canvas/'+ this.nid;

  this.save_timer = window.setTimeout(function(){
    campus_canvas.popup.html('saving ...');
    campus_canvas.popup.dialog('open');
    campus_canvas.popup.dialog('option', 'title', 'please wait');
  }, 1000);
  jQuery.post(url, 
    {canvas: canvas_data}, 
    function() {
      window.clearTimeout(campus_canvas.save_timer);
      campus_canvas.popup.html('');
      campus_canvas.popup.dialog('close');
      window.alert('image map saved');
    }
  );
};

CampusCanvas.prototype.load_state = function() {
  var points = null;
  var nids = null;

  var server_data = jQuery('.field-name-field-map.field-type-image textarea[name="server-data"]').text(); 
  if (server_data.trim()) {
    server_data = JSON.parse(server_data);
    points = server_data.canvas;
    nids = server_data.nids;
  }

  if (points) {
    this.canvas.loadFromJSON(points);
    this.canvas.renderAll();
  }
  if (nids) {
    var objects = this.canvas.getObjects();
    nids = JSON.parse(nids);
    for (i=0;i<objects.length;i++) {
      objects[i].nid = nids[i];
    }
  }
};

CampusCanvas.prototype.clear_state = function() {
  var url = Drupal.settings.basePath + 'canvas/'+ this.nid;
  jQuery.post(url, {canvas: ''});
};
