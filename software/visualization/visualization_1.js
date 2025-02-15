// JS for visualization_1.html

// DEFAULT ---------------------------------------------------------------------

// Range data
var timeseries_name = [];

var dimensions = 3;
var timeseries_data = [];

for (i = 0; i < dimensions; i++) {
  timeseries_data[i] = {
    labels: [0],
    series: [{
      name: 'series-0',
      data: [0]
    }, {
      name: 'series-1',
      data: [0]
    }, {
      name: 'series-2',
      data: [0]
    }, {
      name: 'series-3',
      data: [0]
    }]
  };
}

var connectivity_data = {
  labels: [0],
  series: [{
    name: 'series-positions',
    data: [0]
  }, {
    name: 'series-connection',
    data: [0]
  }]
};

// Set Graph options
var timeseries_options = {
  // Don't draw the line chart points
  showPoint:  false,
  // Disable line smoothing
  lineSmooth: true,
  // X-Axis specific configuration
  axisX: {
    // We can disable the grid for this axis
    showGrid:  false,
    // and also don't show the label
    showLabel: false
  },
  // Y-Axis specific configuration
  axisY: {
    // Lets offset the chart a bit from the labels
    offset: 60,
    // The label interpolation function enables you to modify the values
    // used for the labels on each axis. Here we are converting the
    // values into million pound.
    labelInterpolationFnc: function(value) {
      return value + 'mm';
    }
  },
  // Set maximum and minimum on Y-Axis
  //high: 5000,
  //low:  -500,
  // Modify series individually
  series: {
    'series-0': {
      lineSmooth: Chartist.Interpolation.monotoneCubic(),
      opacity: 0.1
    },
    'series-1': {
      lineSmooth: Chartist.Interpolation.monotoneCubic(),
      opacity: 0.1
    },
    'series-2': {
      showArea: false
    },
    'series-3': {
      showArea: false
    }
  }
};

var connectivity_options = {
  showPoint: true,
  showLine:  true,
  // X-Axis specific configuration
  axisX: {
    // We can disable the grid for this axis
    showGrid:  false,
    // and also don't show the label
    showLabel: false,
    // Make sure that point is not outside (70px)
    offset:    35
  },
  // Y-Axis specific configuration
  axisY: {
    showGrid:  false,
    showLabel: false,
    // Make sure that point is not outside (70px)
    offset:    35
  },
  // Series options for all series
  lineSmooth: Chartist.Interpolation.none( {
    fillHoles: true
  }),
  fillHoles: true,
  showArea:  false
};

// Time series graphs; Mapping: 0 -> 1:2, 1 -> 1:3, 2 -> 2:3
var timeseries = [];
timeseries[0] = new Chartist.Line('#chart0', timeseries_data[0], timeseries_options);

timeseries[1] = new Chartist.Line('#chart1', timeseries_data[1], timeseries_options);

timeseries[2] = new Chartist.Line('#chart2', timeseries_data[2], timeseries_options);

// Connectivity graph
connectivity  = new Chartist.Line('#chart_connectivity', connectivity_data, connectivity_options);


// UPDATE ----------------------------------------------------------------------

// Update graphs
var max_window = 25;
var median_filter_width = 5;

var secondNode_last_x = 1;
var thirdNode_last_x  = 1;

function updateGraphs(eui, ids, ranges) {

  var firstIdx = getIdx(parseInt(eui.charAt(11),16));

  for (let i = 0; i < ids.length; i++) {

    // Find index
    var secondIdx = getIdx(ids[i]);

    // Get graph idx
    var graphIdx  = getGraphIdx(firstIdx, secondIdx);
    var seriesIdx = (firstIdx < secondIdx) ? 0 : 1;

    // Add new range at the end
    timeseries_data[graphIdx].series[seriesIdx    ].data.push(ToInt32(ranges[i]));

    // Add filtered version
    timeseries_data[graphIdx].series[seriesIdx + 2].data.push(median(timeseries_data[graphIdx].series[seriesIdx].data.slice(- Math.min(median_filter_width, timeseries_data[graphIdx].series[seriesIdx].data.length))));

    // Respect max window
    if (timeseries_data[graphIdx].series[seriesIdx].data.length >= max_window) {
      // Shift entire array (labels are ignored) to keep length constant - removes first element
      timeseries_data[graphIdx].series[seriesIdx    ].data.shift();

      timeseries_data[graphIdx].series[seriesIdx + 2].data.shift();
    }

    // Add another label if none does exist
    if (timeseries_data[graphIdx].labels.length < timeseries_data[graphIdx].series[seriesIdx].data.length) {
      timeseries_data[graphIdx].labels.push(timeseries_data[graphIdx].labels.length);
    }

    // Update graph
    timeseries[graphIdx].update(timeseries_data[graphIdx]);
    //console.log('Added measurement from ' + parseInt(eui.charAt(11),16) + '('+ firstIdx + ') to ' + ids[i] + '(' + secondIdx + ')');
  }


  // After having updated the time series, we can now draw the new connectivity graph from the calculated median values

  // 1. node: Fixed at (x=0,y=0)

  // 2. node: Fixed at (x,y=0)

  // Calculate avg distance
  var length_1 = timeseries_data[0].series[2].data.length;
  var length_2 = timeseries_data[0].series[3].data.length;
  var dist_1_2 = Math.floor((timeseries_data[0].series[2].data[length_1 - 1] + timeseries_data[0].series[3].data[length_2 - 1]) / 2);

  // 3. node: At (x>0,y>0)

  // Calculate avg distances
  length_1 = timeseries_data[1].series[2].data.length;
  length_2 = timeseries_data[1].series[3].data.length;
  var dist_1_3 = Math.floor((timeseries_data[1].series[2].data[length_1 - 1] + timeseries_data[1].series[3].data[length_2 - 1]) / 2);

  length_1 = timeseries_data[2].series[2].data.length;
  length_2 = timeseries_data[2].series[3].data.length;
  var dist_2_3 = Math.floor((timeseries_data[2].series[2].data[length_1 - 1] + timeseries_data[2].series[3].data[length_2 - 1]) / 2);

  // Compute x_3 and y_3 using Heron's formula: https://en.wikipedia.org/wiki/Heron%27s_formula
  var s = (dist_1_2 + dist_1_3 + dist_2_3) / 2;

  var x_3 = Math.floor((dist_1_3*dist_1_3 + dist_1_2*dist_1_2 - dist_2_3*dist_2_3) / (2 * dist_1_2));
  var y_3 = Math.floor(2 * Math.sqrt(s*(s - dist_1_2)*(s - dist_1_3)*(s - dist_2_3)) / dist_1_2);

  //console.log('s: ' + s + ' ; dist_1_2: ' + dist_1_2 + ' ; dist_1_3: ' + dist_1_3 + ' ; dist_2_3: ' + dist_2_3);

  // Cannot update if: a) x_3 < 0 (cannot display negative indexes), b) y_3 is NaN (invalid inputs)
  if ((x_3 > 0) && !isNaN(y_3)) {

    // Delete old points which are no longer valid
    connectivity_data.series[0].data[secondNode_last_x] = null;
    connectivity_data.series[0].data[thirdNode_last_x]  = null;

    // Update position
    connectivity_data.series[0].data[dist_1_2] = 0;
    connectivity_data.series[0].data[x_3]      = y_3;

    // Second series only contains the point with larger x coordinate
    connectivity_data.series[1].data[Math.max(secondNode_last_x, thirdNode_last_x)] = null;

    if (dist_1_2 > x_3) {
      // Second point will be stored
      connectivity_data.series[1].data[dist_1_2] = 0;
    } else {
      // Third point will be stored
      connectivity_data.series[1].data[x_3] = y_3;
    }

    // Update the final graph
    connectivity.update(connectivity_data);
    console.log('Updated connectivity: 0 -> (0,0), 1 -> (' + dist_1_2 + ',0), 2 -> (' + x_3 + ',' + y_3 + ')');

    // Store data for next round
    secondNode_last_x = dist_1_2;
    thirdNode_last_x  = x_3;

  } else {
    // Cannot calculate position, so do not update anything
    if (isNaN(y_3)) {
      console.log('Cannot update; y_3 is NaN!');
    } else if (x_3 < 0) {
      console.log('Cannot update; x_3 is negative with value ' + x_3);
    } else {
      console.log('Cannot update; unknown error!');
    }
  }
}


// Connect to socket.io server -------------------------------------------------
//var socket = new io.Socket('localhost:8081');
var socket = io();
socket.connect();

socket.on('message', function(data){
  // Parse data
  var eui = data.substring(0,12);

  //console.log('Received data from node ' + eui + ' with length ' + data.length);

  var ids  = [];
  var range = [];

  var data_array = data.split(',');
  var length = parseInt(data_array[0].split(':')[1],10);

  for (i = 0; i < length; i++) {
    ids[i]   = parseInt(data_array[1 + 2*i    ], 10);
    range[i] = parseInt(data_array[1 + 2*i + 1], 10);
    //console.log('Added distance ' + range[i] + ' to node ' + ids[i]);
  }

  console.log('Received IDs ' + ids + ' with ranges ' + range + ' from EUI ' + eui);
  updateGraphs(eui, ids, range);

  //console.log('Data successfully updated');
});



// HELPERS ---------------------------------------------------------------------

// Create multi-dimensional array
function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    } else {
      // Initialize with 0
      arr.fill(0);
    }

    return arr;
}

// Find index of given EUI
function getIdx(eui) {

  var found_idx = false;
  var idx = 0;

  while (!found_idx) {

    if (typeof timeseries_name[idx] == 'undefined') {
      // Not in array yet
      timeseries_name[idx] = eui;

      found_idx = true;

      updateAxisTitles(idx);
    } else if (timeseries_name[idx] == eui) {
      // Entry already exists
      found_idx = true;
    } else {
      // Iterate
      idx++;
    }

  }

  //console.log('Found index: ' + idx + ' for EUI ' + eui);
  return idx;
}

// Find index of time series graph
function getGraphIdx(idx_1, idx_2) {

  if ( (idx_1 == 0) || (idx_2 == 0) ) {
    if ( (idx_1 == 1) || (idx_2 == 1) ) {
      return 0;
    } else {
      return 1;
    }
  }
  else {
    return 2;
  }
}

// Convert negative numbers from UInt32 to Int32
function ToInt32(x) {
    if (x >= Math.pow(2, 31)) {
        return x - Math.pow(2, 32)
    } else {
        return x;
    }
}

// Calculate the median values
function median(array) {
  array.sort((a, b) => a - b);
  return (array[(array.length - 1) >> 1] + array[array.length >> 1]) / 2;
}

// Update axis titles below the time series
function updateAxisTitles(index) {
  var names;

  switch(index) {
    case 0:
      names = document.getElementsByClassName('eui_0');
      for (let i = 0; i < names.length; i++) { names[i].innerHTML = '0' + timeseries_name[0].toString(16).toUpperCase();}
      break;
    case 1:
      names = document.getElementsByClassName('eui_1');
      for (let i = 0; i < names.length; i++) { names[i].innerHTML = '0' + timeseries_name[1].toString(16).toUpperCase();}
      break;
    case 2:
      names = document.getElementsByClassName('eui_2');
      for (let i = 0; i < names.length; i++) { names[i].innerHTML = '0' + timeseries_name[2].toString(16).toUpperCase();}
      break;
    default:
  }

}
