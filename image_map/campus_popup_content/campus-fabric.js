
var campus_canvas = null;

function CampusCanvas(id) {
  this.polygon = null;
  this.selected_region = null;
  this.first = null;
  this.current_points = [];
  this.canvas = new fabric.Canvas(id);
  this.canvas.hoverCursor = 'pointer';
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

  this.map_config_setup();

  var textOptions = {
    fontSize: 16, 
    textDecoration: 'underline',
    stroke: 'black',
    textBackgroundColor: 'white',
  };
  this.text = new fabric.Text('', textOptions);
}

(function($) {
  $(document).ready(function () {
    if (typeof fabric == 'undefined') {
      return;
    }

    campus_canvas = new CampusCanvas('campus-canvas-image');

    campus_canvas.hover_toggle = 0;
    campus_canvas.canvas.on('mouse:over', function(e){
      if (campus_canvas.hover_toggle) {
        return;
      }
      campus_canvas.hover_toggle = 1;
      e.target.setOpacity(campus_canvas.mode.opacity_over);
      campus_canvas.tooltip(e.target);
      campus_canvas.canvas.renderAll();
    });
    
    campus_canvas.canvas.on('mouse:out', function(e){
      if (!campus_canvas.hover_toggle) {
        return;
      }
      campus_canvas.hover_toggle = 0;
      e.target.setOpacity(campus_canvas.mode.opacity_out);
      campus_canvas.tooltip(null);
      campus_canvas.canvas.renderAll();
    });

    campus_canvas.canvas.on('mouse:down', function(e){
      campus_canvas.addPoint(e);
    });
    
    campus_canvas.canvas.on('object:selected', function(e){
      if (campus_canvas.polygon != null || campus_canvas.first != null) {
        campus_canvas.selected_region = null;
        return;
      }
      if (campus_canvas.mode.name == 'view') {
        return;
      }
      campus_canvas.polygon_button.text('edit region');
      if (campus_canvas.selected_region) {
        // previous selected region
        campus_canvas.selected_region.setStroke('white');
      }
      campus_canvas.selected_region = e.target;
      campus_canvas.selected_region.setStroke('red');
    });

    campus_canvas.canvas.on('selection:cleared', function(e){
      campus_canvas.polygon_button.text('add region');
      if (campus_canvas.selected_region) {
        campus_canvas.selected_region.setStroke('white');
      }
      campus_canvas.selected_region = null;
      
    });

    campus_canvas.polygon_button.click(
      function(e) {
        if (campus_canvas.selected_region == null && campus_canvas.polygon == null) {
          window.alert('no region is selected');
          return;
        }
        var config = null;
        if (campus_canvas.selected_region) { 
          config = campus_canvas.selected_region.map_config;
        }
        else {
          config = {nid: null, url: null};
        }
        campus_canvas.map_config_form(config);
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
  this.save_state();
};

CampusCanvas.prototype.add_polygon = function() {
  var config = {nid: null, url: null, url_title: null};
  if (this.map_config.tab == 1) {
    config.nid = this.map_config.suggestions.val();
  }
  else {
    config.url = this.map_config.textinput.filter('[name=link]').val();
    config.url = Drupal.checkPlain(config.url);
    config.url_title = this.map_config.textinput.filter('[name=title]').val();
    config.url_title = Drupal.checkPlain(config.url_title);
  }

  if (this.selected_region != null) {
    this.selected_region.map_config = config;
    this.save_state();
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
    stroke: 'white',
    fill: 'black',
    opacity: 0.5,
    perPixelTargetFind: true,
  };
  var new_polygon = new fabric.Polygon(this.current_points, options);
  new_polygon.map_config = config;
  this.canvas.add(new_polygon);
  this.current_points = [];

  this.save_state();
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
      this.polygon.map_config = null;
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

CampusCanvas.prototype.tooltip = function(target) {
  if (target == null) {
    this.canvas.remove(this.text);
    return;
  }
  if (target.map_config == null) {
    return;
  }
  var config = target.map_config;
  var info = (config.nid == null) ?  config.url_title : this.nodes[config.nid].title;
  this.text.setText(info);
  this.text.setLeft(target.getLeft());
  this.text.setTop(target.getTop());
  this.canvas.add(this.text);
  this.canvas.sendToBack(this.text);
};

(function($) {
  CampusCanvas.prototype.map_config_setup = function() {
    var this_canvas = this;

    this.map_config = $('#map-config');
    this.map_config.tabs = this.map_config.find('input[type=radio][name=tab]');
    this.map_config.suggestions = this.map_config.find('select');
    this.map_config.textinput = this.map_config.find('input[type=text]');
    this.map_config.linkset = this.map_config.find('fieldset');
    
    this.map_config.tabs.change(
      function(e) {
        var widget = this_canvas.map_config;
        widget.tab = $(this).val();
        if (widget.tab == '1') {
          widget.textinput.attr('disabled', 'disabled');
          widget.linkset.hide();
          widget.suggestions.removeAttr('disabled').show();
        }
        else {
          widget.suggestions.hide().attr('disabled', 'disabled');
          widget.textinput.removeAttr('disabled');
          widget.linkset.show();
        }
      }
    );

    var buttons_calls = {
      Confirm: 
        function() { 
          $(this).dialog('close'); this_canvas.add_polygon(); 
        },
      Open: 
        function() { 
          $(this).dialog('close'); this_canvas.open_content(); 
        },
      Delete: 
        function() { 
          $(this).dialog('close'); this_canvas.delete_polygon(); 
        }
    };
    this.map_config.dialog({
        autoOpen : false,
        modal: true,
        title: 'Choose item for selected region',
        open: function(event, ui) {
          $('.ui-dialog-titlebar button.ui-dialog-titlebar-close').text('X');
        },
        buttons: buttons_calls,
    });
  };
})(jQuery);

CampusCanvas.prototype.map_config_form = function(config) {
  var widget = this.map_config;

  if (config.url != null) {
    widget.suggestions.hide().attr('disabled', 'disabled');
    widget.textinput.removeAttr('disabled');
    widget.find('input[name=link]').val(config.url);
    widget.find('input[name=title]').val(config.url_title);
    widget.linkset.show();
    widget.tabs.filter('[value=2]').attr('checked', 'checked');
    widget.tab = 2;
  }
  else  {
    widget.tab = 1;
    widget.suggestions.removeAttr('disabled').show();
    widget.linkset.hide();
    widget.textinput.val('').attr('disabled', 'disabled');
    widget.tabs.filter('[value=1]').attr('checked', 'checked');
    if (config.nid != null) {
      widget.suggestions.val(config.nid);
    }
  }

  widget.dialog('open');
};

CampusCanvas.prototype.open_content = function() {
  var config = this.selected_region.map_config;
  if (config.nid != null) {
    var nid = config.nid;
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
  else if (config.url != null) {
    if (config.url.match(/^http:\/\//) == null) {
      config.url = 'http://' + config.url;
    }
    window.location.href = config.url;
  }
  else {
    window.alert('error: undefined target');
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
//    obj.selectable = false;
    obj.hasControls = false;
    obj.hasBorders = false;
    obj.lockMovementX = true;
    obj.lockMovementY = true;
    obj.setFill('#000');
    obj.setOpacity(CampusCanvas.view_config.opacity_out);
    obj.setStroke('white');
    obj.perPixelTargetFind = true;
  });
  if (this.polygon_button.length > 0) {
    this.polygon_button.attr('disabled', 'disabled');
    this.mode_button.text('edit');
    this.toggle_mode = this.edit_mode;
  }
  this.canvas.deactivateAll().renderAll();
};

CampusCanvas.prototype.edit_mode = function() {
  this.mode = CampusCanvas.edit_config;
  this.canvas.forEachObject(function(obj) {
//    obj.selectable = true;
    obj.hasControls = true;
    obj.hasBorders = true;
    obj.lockMovementX = false;
    obj.lockMovementY = false;
    obj.setOpacity(CampusCanvas.edit_config.opacity_out);
    obj.setStroke('white');
    obj.perPixelTargetFind = true;
  });
  this.polygon_button.removeAttr('disabled');
  this.mode_button.text('view');
  this.toggle_mode = this.view_mode;
  this.polygon_button.text('add region');
  this.canvas.deactivateAll().renderAll();
};

CampusCanvas.prototype.save_state = function() {
  var points = JSON.stringify(this.canvas);

  var objects = this.canvas.getObjects();
  var configurations = [];
  for (i=0; i<objects.length; i++) {
    configurations[i] = objects[i].map_config;
  }
  configurations = JSON.stringify(configurations);

  var canvas_data = {canvas: points, configurations: configurations};
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
  var configurations = null;

  var server_data = jQuery('.field-name-field-map.field-type-image textarea[name="server-data"]').text(); 
  if (server_data.trim()) {
    server_data = JSON.parse(server_data);
    points = server_data.canvas;
    configurations = server_data.configurations;
  }

  if (points) {
    this.canvas.loadFromJSON(points);
    this.canvas.renderAll();
  }
  if (configurations) {
    var objects = this.canvas.getObjects();
    configurations = JSON.parse(configurations);
    for (i=0;i<objects.length;i++) {
      objects[i].map_config = configurations[i];
    }
  }
};

CampusCanvas.prototype.clear_state = function() {
  var url = Drupal.settings.basePath + 'canvas/'+ this.nid;
  jQuery.post(url, {canvas: ''});
  window.location.reload();
};
