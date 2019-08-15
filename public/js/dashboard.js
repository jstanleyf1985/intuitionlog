document.addEventListener("DOMContentLoaded", function(event) {
let height = window.innerHeight;
let winWidth = window.innerWidth;
let navMenu = document.querySelector('#navigation');
let dashboard = document.querySelector('#dashboardWrapper');
let navigation = document.querySelector('#navigation');
// Assign navigation menu and dashboard height to equal window height
navMenu.style.height = height + 'px';
dashboard.style.height = height + 'px';

/**************STYLE BASED CHANGES */
navigation.style.height = window.innerHeight + 'px';


// MEDITATION MODULE
$('#meditation, .meditation').click(function() {
  $.get('https://www.intuitionlog.com/html/meditation/meditation.html', (data, status) => {
    let meditationPage = data;
    $('#dashboard').empty();
    $('#dashboard').prepend(meditationPage);

    // MEDITATION QUICK VIEW
    $('#medQuickview').click(function() {
      $.ajax({
        type: 'POST',
            url: 'https://www.intuitionlog.com/dashboard/meditation/quickview',
            data: '',
            dataType: 'json',
            success: (quickResults) => {
              if(quickResults.success == false) {
                // No data exists, display no data found html
                $('#addEditDeleteAJAX').empty();
                $('#addEditDeleteAJAX').prepend(`
                  <div id='noMeditationsFound' class='center block relative'>
                  <h1>It looks like there are no meditations added yet.</h1>
                  <p>To add meditations select the ADD button above and fill out the form.</p>
                  </div>`);
                } else if(quickResults.success == true) {
                  // Build information
                  $('#addEditDeleteAJAX').empty();
                  $('#addEditDeleteAJAX').append(`
                    <section id='medQuickViewMain' class='center block marginZero paddingZero'>
                      <div class='center block marginZero'>
                        <h2>Latest Meditations (10)</h2>`);
                            for(let x = 0; x < quickResults.data.length; x++) {
                              // Check if rating is NULL, transform to 'Not Entered'
                              if(quickResults.data[x].meditationRating == null) {
                                quickResults.data[x].meditationRating = 'Not Entered';
                              }
                  $('#medQuickViewMain h2').after(`
                          <ul class='medQuickViewSection'>
                            <li class='medQuickViewItem'>${quickResults.data[x].meditationName}</li>
                            <li class='medQuickViewItem'>
                              <span>Type:&nbsp;&nbsp;</span>
                              <span>${quickResults.data[x].meditationName}</span></li>
                            <li class='medQuickViewItem'>
                              <span>Duration: &nbsp;&nbsp;</span>
                              <span>${quickResults.data[x].meditationDuration}</span></li>
                            <li class='medQuickViewItem'>
                              <span>Rating: &nbsp;&nbsp;</span>
                              <span>${quickResults.data[x].meditationRating}</span></li>
                            <li class='medQuickViewItem'>
                              <span class='medQuickNotesLabel'>Notes: &nbsp;&nbsp;</span>
                              <span class='medQuickNotesInfo'>${quickResults.data[x].meditationNotes}</span></li>
                          </ul>
                            `);
                          };
                  $('#medQuickViewMain').append(`
                      </div>
                    </section>
                  `);

                  // Remove add edit delete bar
                  $('#addEditDelete').attr('style', 'visibility: hidden');

                  
                } else {}
            },
            error: function (xhr, ajaxOptions, thrownError) {
              //alert(xhr.status);
              //alert(thrownError);
            }
      });
      $('#dashboardForm').empty();
    });

    // MEDITATION REPORTS
    $('#medReports').click(function() {
      // LOAD INITIAL DATA
      let medReportsListHTML = null;
      $.get('https://www.intuitionlog.com/html/meditation/medReportList.html', (datalist, status) => {
        if(datalist) {
          medReportsListHTML = datalist;
          // Get list of meditation reports available
          $('#addEditDeleteAJAX').empty();
          $('#addEditDeleteAJAX').prepend(medReportsListHTML);

          // Remove add edit delete bar
          $('#addEditDelete').attr('style', 'visibility: hidden');
        }

        // CONTROL REPORT GENERATOR
        $('#medReportsGenerator').click(function() {
          let medReportsHTML = null;
          $.get('https://www.intuitionlog.com/html/meditation/medReports.html', (data, status) => {
            if(data) {
              medReportsHTML = data;
              // Generate form from HTML in the GET request above
              $('#addEditDeleteAJAX').empty();
              $('#addEditDeleteAJAX').prepend(medReportsHTML);
    
              // Creates checkbox dropdown menu for the form
              // Simple checkbox function for meditation dropdown menu
              let expanded = false;
              $('.selectBox, #doneBTN').click(function(e) {
                e.preventDefault();
    
                if (!expanded) {
                  $('#checkboxes').attr('style', 'display: block');
                  expanded = true;
                } else {
                  $('#checkboxes').attr('style', 'display: none');
                  expanded = false;
                }
              });
              
              // Remove add edit delete bar
              $('#addEditDelete').attr('style', 'visibility: hidden');
    
              // Prevent reset BTN from triggering submit
              $('.resetBTN').click(function(e) {
                e.preventDefault();
    
                // Reset value to null
                $(this).parent().children('div').find('input').val(null);
                $('.errMSG').remove();
              });
    
              // Rating check
              $('#medReportRating input').bind('keyup click change', function() {
                if($(this).val() == null || $(this).val() == undefined || $(this).val() == '') {
                  // Not filled in, optionally do not check values to determine if they're valid
                } else {
                  let err = 'no errors';
    
                  // Check values
                  if(typeof $(this).val() == 'string') {
                    let ratingVal = $(this).val();
                    let ratingValT = ratingVal.trim();
                    if(ratingValT.length > 0 && ratingValT.length < 4) {
                      $('.errMSG').remove();
    
                      // Check against array of valid entries
                      let ratingArr = ['0.0', '0.5', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '0', '1', '2', '3', '4', '5'];
                      if(ratingArr.indexOf(ratingValT) != -1) {
                        $('.errMSG').remove();
                      } else {
                        err = 'Value must be 0 - 5 in 0.5 increments. Example: 4.5';
                        $('.errMSG').remove();
                        $(this).parent().parent().find('.resetBTN').before(`<div class='errMSG'>${err}</div>`);
                      }
                    } else {
                      err = 'Value must be 1 or 3 characters long. Example: 5.0';
                      $('.errMSG').remove();
                      $(this).parent().parent().find('.resetBTN').before(`<div class='errMSG'>${err}</div>`);
                    }
                  }
                }
                
              });
    
              // Duration check
              $('#medReportDuration input').bind('keyup click change', function() {
                if($(this).val() == null || $(this).val() == undefined || $(this).val() == '') {
                  // Not filled in, optionally do not check values to determine if they're valid
                } else {
                  let err = 'no errors';
    
                  // Check values
                  if(typeof $(this).val() == 'string') {
                    let durationVal = $(this).val();
                    let durationValT = durationVal.trim();
                    if(durationValT.length > 0 && durationValT.length < 5) {
                      $('.errMSG').remove();
    
                      // Check against regex for numbers only
                      let checkDuration = new RegExp(/^[0123456789]+$/i);
                      if(checkDuration.test(durationValT)) {
                        $('.errMSG').remove();
    
                        // Check if between 1 and 1440
                        let durationValInt = parseInt(durationValT);
                        if(durationValInt > 1 && durationValInt < 1441) {
                          $('.errMSG').remove();
                        } else {
                          err = 'Value must be a number between 1 and 1440';
                          $('.errMSG').remove();
                          $(this).parent().parent().find('.resetBTN').before(`<div class='errMSG'>${err}</div>`);
                        }
                      } else {
                        err = 'Value must be a number.';
                        $('.errMSG').remove();
                        $(this).parent().parent().find('.resetBTN').before(`<div class='errMSG'>${err}</div>`);
                      }
                      
                    } else {
                      err = 'Value must be 1 - 4 characters long. Example: 60';
                      $('.errMSG').remove();
                      $(this).parent().parent().find('.resetBTN').before(`<div class='errMSG'>${err}</div>`);
                    }
                  }
                }
                
              });
    
              // Notes check
              $('#medReportNotes input').bind('keyup click change', function() {
                if($(this).val() == null || $(this).val() == undefined || $(this).val() == '') {
                  // Not filled in, optionally do not check values to determine if they're valid
                  $('.errMSG').remove();
                } else {
                  let err = 'no errors';
                  if(typeof $(this).val() == 'string') {
                    // Check length
                    let keyword = $(this).val();
                    let keywordT = keyword.trim();
                    if(keywordT.length > 0 && keywordT.length < 254) {
                      $('.errMSG').remove();
    
                      // Check regex
                      let checkKeyword = new RegExp(/^[a-zA-Z0-9-,' ]+$/i)
                      if(checkKeyword.test(keywordT)) {
                        $('.errMSG').remove();
                      } else {
                        err = 'Keyword list must be letters and numbers';
                        $('.errMSG').remove();
                        $(this).parent().parent().find('.resetBTN').before(`<div class='errMSG'>${err}</div>`);
                      }
                    } else {
                      err = 'Keyword list must be less than 255 characters long';
                      $('.errMSG').remove();
                      $(this).parent().parent().find('.resetBTN').before(`<div class='errMSG'>${err}</div>`);
                    }
                  }
                }
              });
    
              // Controls 'check all' option dropdown for meditation type
              let checkboxBool = false;
              $('#checkboxes input[name="all"]').click(function() {
                if(checkboxBool == false) {
                  $('#checkboxes input').prop('checked', true);
                  $('#checkboxes input[name="all"]').prop('checked', false);
                  checkboxBool = true;
                } else {
                  $('#checkboxes input').prop('checked', false);
                  $('#checkboxes input[name="all"]').prop('checked', false);
                  checkboxBool = false;
                }
              });
    
              // Submit reportgenerator filters to server
              $('#reportGen').submit(function(e) {
                e.preventDefault();
    
                // Set initial values
                let typeSelected = [];
                let dateFrom = null;
                let dateTo = null;
                let ratingFrom = null;
                let ratingTo = null;
                let durationFrom = null;
                let durationTo = null;
                let keyword = null;
                let sortFilter = null;
                let orderFilterA = null;
                let orderFilterB = null;
    
                // Get selected types
                $.each($('#checkboxes input[type="checkbox"]:checked'), function() {
                  typeSelected.push($(this).siblings('span')[0].textContent);
                });
    
                // Init post data object
                let medFilterData = {};
    
                // Set type select values
                medFilterData.typeSelected = typeSelected;
                // Set date ratings
                medFilterData.dateFrom = $('input[name="begindate"]').val();
                medFilterData.dateTo = $('input[name="enddate"]').val();
                // Set selected rating
                medFilterData.ratingFrom = $('input[name="beginRating"]').val();
                medFilterData.ratingTo = $('input[name="endRating"]').val();
                // Set selected duration
                medFilterData.durationFrom = $('input[name="beginDuration"]').val();
                medFilterData.durationTo = $('input[name="endDuration"]').val();
                // Set selected keyword
                medFilterData.keyword = $('input[name="notesSearch"]').val();
                // Set selected sort
                medFilterData.sortFilter = $('select[name="sortby"] option:selected').text();
                // Set selected order
                medFilterData.orderFilterA = $('select[name="orderby"] option:selected').text();
                medFilterData.orderFilterB = $('select[name="ascdesc"] option:selected').text();
                $.ajax({
                  type: 'POST',
                      url: 'https://www.intuitionlog.com/dashboard/meditation/reports',
                      data: medFilterData,
                      dataType: 'json',
                      success: (medResults) => {
                        if(medResults.success == true) {
                          if(medResults.data) {
                            // Success, call the report and display in place of the report generator page
                            $.get('https://www.intuitionlog.com/html/meditation/medReportGenerator.html', function(getData, status) {
                              if(medResults.data) {
                                if(medResults.submittedValues) {
                                  // Convert ISO Time strings to readable time without T or .000Z
                                  let newDateFrom = medResults.submittedValues.dateFrom.replace('T00:00:00.000Z', '');
                                  let newDateTo = medResults.submittedValues.dateTo.replace('T:23:59:59:000Z', '');

                                  let header = {
                                    today: new Date().toISOString().replace('T', ' ').substring(16, -1),
                                    dateFilter: `Begin Date: ${newDateFrom} - End Date: ${newDateTo}`,
                                    ratingFilter: `Minimum Rating: ${medResults.submittedValues.ratingFrom} stars - Maximum Rating: ${medResults.submittedValues.ratingTo} stars`,
                                    durationFilter: `Min Duration: ${medResults.submittedValues.durationFrom} minutes - Max Duration: ${medResults.submittedValues.durationTo} minutes`,
                                    keywordFilter: `${medResults.submittedValues.keyword}`,
                                    sortFilter: `${medResults.submittedValues.sortby}`,
                                    orderFilter: `${medResults.submittedValues.orderby}`
                                  };

                                  // Replace html header information before appending
                                  getData = getData.replace('#date', header.today);
                                  getData = getData.replace('#dateFilter', header.dateFilter);
                                  getData = getData.replace('#ratingFilter', header.ratingFilter);
                                  getData = getData.replace('#durationFilter', header.durationFilter);
                                  getData = getData.replace('#keywordFilter', header.keywordFilter);
                                  getData = getData.replace('#sortFilter', header.sortFilter);
                                  header.orderFilter == 1 ? header.orderFilter = 'Ascending' : header.orderFilter = 'Descending';
                                  getData = getData.replace('#orderFilter', header.orderFilter);

                                  let bodyString = '';
                                  for(result in medResults.data) {
                                    if(medResults.data[result].meditationRating == 'null') {
                                      medResults.data[result].meditationRating = 'None given';
                                    }

                                    // Convert date to readable string before outputting
                                    let newMedDate = String(medResults.data[result].meditationDate);
                                    newMedDate = newMedDate.replace('T', ' ');
                                    newMedDate = newMedDate.replace('.000Z', '');
                                    bodyString = bodyString.concat(`
                                    <div class='bodyItemWrapper collapsed'>
                                      <h2 class='bodyItemName'>Name: ${medResults.data[result].meditationName}</h2>
                                      <span class='bodyItem'>Date: ${newMedDate}</span>
                                      <span class='bodyItem'>Type: ${medResults.data[result].meditationType}</span>
                                      <span class='bodyItem'>Rating: ${medResults.data[result].meditationRating}</span>
                                      <span class='bodyItem'>Duration: ${medResults.data[result].meditationDuration}</span>
                                      <span class='bodyItem'>Notes: ${medResults.data[result].meditationNotes}</span>
                                    </div>`);
                                  }
                                  
                                  // Clear and draw report
                                  $('#addEditDeleteAJAX').empty();
                                  $('#addEditDeleteAJAX').append(getData);
                                  $('#reportBody').append(bodyString);

                                  // Control collapse / expand buttons
                                  $('.reportGenBTN').click(function() {
                                    if($(this).text() == 'Collapse All') {
                                      $('.bodyItemWrapper span').attr('style', 'display: none');
                                    } else if($(this).text() == 'Expand All') {
                                      $('.bodyItemWrapper span').attr('style', 'display: block');
                                    };
                                  });

                                  //  Control collapse / expand on element click
                                  $('.bodyItemWrapper').click(function() {
                                    if($(this).hasClass('collapsed')) {
                                      $(this).children('span').attr('style', 'display: block');
                                      $(this).removeClass('collapsed');
                                    } else {
                                      $(this).children('span').attr('style', 'display: none');
                                      $(this).addClass('collapsed');
                                    }
                                  });

                                  // CREATE MEDITATION LISTING PDF / EXCEL
                                  $('.reportGenBTN2').click(function() {
                                    // Get data for CSV (must be outside CSV function)
                                    //'Name', 'Date', 'Type', 'Rating', 'Duration', 'Notes'
                                    let dataArr = [['Name', 'Date', 'Type', 'Rating', 'Duration', 'Notes']];
                                    let dataArrItems = [];
                                    let dataArrItemsFiltered = [];
                                    $('.bodyItemWrapper').each(function(element) {
                                      // Reset dataArrItems per iteration, add new items and push each array to dataArr
                                      dataArrItems = [];
                                      dataArrItemsFiltered = [];
                                      // Obtain dataArrItems and stuff them into an array which will be passed to dataArr as a whole array
                                      $(this).children().each(function(item) {
                                        dataArrItems.push($(this).text());
                                      });
                                      // Remove extra text from values
                                      dataArrItemsFiltered = dataArrItems.map(function(value) {
                                        if(value.indexOf('Name: ') != -1) {return value.replace('Name: ', '');
                                        } else if(value.indexOf('Date: ') != -1) {return value.replace('Date: ', '');}
                                          else if(value.indexOf('Rating: ') != -1) {return value.replace('Rating: ', '');}
                                          else if(value.indexOf('Duration: ') != -1) {return value.replace('Duration: ', '');}
                                          else if(value.indexOf('Notes: ') != -1) {return value.replace('Notes: ', '');}
                                          else if(value.indexOf('Type: ') != -1) {return value.replace('Type: ', '');}
                                      });
                                      dataArr.push(dataArrItemsFiltered);
                                    });


                                    if($(this).text() == 'PDF') {
                                      $('#medReportGenerated').prepend('<script src="https://www.intuitionlog.com/js/jspdf.js"></script>');
                                      function demoFromHTML() {
                                        var pdf = new jsPDF('p', 'pt', 'letter');
                                        // source can be HTML-formatted string, or a reference
                                        // to an actual DOM element from which the text will be scraped.
                                        source = $('#reportBody')[0];

                                        // we support special element handlers. Register them with jQuery-style 
                                        // ID selector for either ID or node name. ("#iAmID", "div", "span" etc.)
                                        // There is no support for any other type of selectors 
                                        // (class, of compound) at this time.
                                        specialElementHandlers = {
                                            // element with id of "bypass" - jQuery style selector
                                            '#bypassme': function (element, renderer) {
                                                // true = "handled elsewhere, bypass text extraction"
                                                return true
                                            }
                                        };
                                        margins = {
                                            top: 80,
                                            bottom: 60,
                                            left: 40,
                                            width: 522
                                        };
                                        // all coords and widths are in jsPDF instance's declared units
                                        // 'inches' in this case
                                        pdf.fromHTML(
                                        source, // HTML string or DOM elem ref.
                                        margins.left, // x coord
                                        margins.top, { // y coord
                                            'width': margins.width, // max width of content on PDF
                                            'elementHandlers': specialElementHandlers
                                        },
                                
                                        function (dispose) {
                                            // dispose: object with X, Y of the last line add to the PDF 
                                            //          this allow the insertion of new lines after html
                                            pdf.save('Test.pdf');
                                        }, margins);
                                    }
                                    demoFromHTML();
                                    } else if($(this).text() == 'CSV') {
                                      $('#downloadCSV').remove();

                                      function download_csv() {
                                        let csv = 'Report';
                                        dataArr.forEach(function(row) {
                                          csv += row.join(',');
                                          csv += '\n';
                                        });

                                        let csvHREF = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
                                        $('#reportBody').append(`<a id="downloadCSV" href="${csvHREF}" target="_blank" download="MeditationListing.csv"> </a>`);
                                      }

                                      download_csv();
                                      $('#downloadCSV')[0].click();
                                    } else if($(this).text() == 'Print') {
                                      window.print();
                                    }
                                  });
                                } else {
                                  $('.errMSG').remove();
                                  $('#submitReportGen').before(`<div class='errMSG'>Unable to locate data requested</div>`);
                                }
                                
                              } else {
                                $('.errMSG').remove();
                                $('#submitReportGen').before(`<div class='errMSG'>Unable to locate page requested</div>`);
                              }
                            });
                          } else {
                            // Failed to obtain data, no data object returned
                            $('.errMSG').remove();
                            $('#submitReportGen').before(`<div class='errMSG'>Error obtaining data - try again</div>`);
                          }
                          
    
                        } else if(medResults.success == false) {
                          if(medResults.errMSG) {
                            $('.errMSG').remove();
                            $('#submitReportGen').before(`<div class='errMSG'>${medResults.errMSG}</div>`);
                          }
                        } else {}
                      },
                      error: function (xhr, ajaxOptions, thrownError) {
                        //alert(xhr.status);
                        //alert(thrownError);
                      }
            });
              });
            }
          });
          });

      });
      
      
      
    });

    // FRIENDS SECTIONS
    $('#medFriends').click(function(event) {
      event.preventDefault();
      event.stopPropagation();

      $.get('https://www.intuitionlog.com/html/meditation/medFriends.html', function(data, status) {
          let friendsPage = data;
          $('#addEditDeleteAJAX').empty();
          $('#addEditDeleteAJAX').prepend(friendsPage);
          
          // Remove add edit delete bar
          $('#addEditDelete').attr('style', 'visibility: hidden');
          $('.notes').remove();
          $('.rating').remove();

          // Load initial friends listing
          loadFriendsList();

          // Controls friend listing and find buttons
          $('.friendsBTN1').click(function() {$(this).addClass('frSelected');$('.friendsBTN2').removeClass('frSelected');});
          $('.friendsBTN2').click(function() {$(this).addClass('frSelected');$('.friendsBTN1').removeClass('frSelected');});

          // Load friends list
          $('.friendsBTN1').click(function() {
            loadFriendsList();
          });

          // Load friends search
          $('.friendsBTN2').click(function() {
            loadFriendsSearch();

            waitForElementLoad('.add', function() {
              $('.add').click(function() {
                sendFriendRequest($(this));
              });
            });
          });

          // Send friend request
          $('.add').on('click', function() {
            console.log($(this));
          });

      });
    });

    // Create meditation chart
    drawMeditationChart();
    // Set click event to reload meditation add
    $('.meditationAdd').click(() => {$('#meditation').trigger('click');});

    // Generates star images and rating values
    generateStars();
    // Reset rating will return rating value to 0 and remove images
    $('#resetStars').click((e) => {e.preventDefault(); e.stopPropagation();resetStars();});
    

    // Create function that counts text in the textarea and displays a warning section beneath
    // the field to display to the user if their input text length is too long > 5000 characters
    // Set initial value for duration
    $('#duration').val('1');
    intervalChecks;
    

    // Load meditation list for editing
    $('.meditationEdit').click((event) => {
      event.preventDefault();
      event.stopPropagation();

      let data = {};
      $.ajax({
        type: 'POST',
        url: 'https://www.intuitionlog.com/dashboard/meditation/view',
        data: data,
        dataType: 'json',
        success: (data) => {
          if(data.success === true) {
            $('#addEditDeleteAJAX').empty();

            // Check if there are any returned results
            if(data.data.length > 0) {
              // Data exists, show list of results
              let readableTime = undefined;
              for(let a = 0; a < data.data.length; a++) {
                // Prevent nothing from showing if invalid date exists
                if(data.data[a].date) {
                  let dbDate = new Date(data.data[a].date);
                  readableTime = dbDate.toISOString().replace(/T/, ' ').replace(/\..+/, '');
                  readableTime = readableTime.slice(0, -3);
                  if(isValidDate(dbDate)) {} else {
                    readableTime = 'Missing Date';
                  };
                } else {
                  readableTime = 'Missing Date';
                }
                
                
                
                $('#addEditDeleteAJAX').prepend(`<div class='meditationEntryWrapper'>
                <div class="meditationEntry">
                  <div class="meditationEntry">
                    <span class='meditationSpan meditationSpanID hidden'>${data.data[a]._id}</span>
                    <span class='meditationSpan'> ${data.data[a].meditationName} </span>
                    <span class='meditationSpan'> ${readableTime} </span>
                    <span class='meditationSpan'><span class='editMeditation'>Edit</span><span>
                  </div>
                </div>
              </div>
              `);
            }
            // disable error checking interval while on the edit meditation screen
            clearInterval(intervalChecks);
            $('#addEditDeleteAJAX').after(`<div id="meditationErrors"></div><div id="meditationWarnings"></div>`);
            $('.editMeditation').click(function() {
                let meditationDataEdit = {};
                meditationDataEdit.id = $(this).parent().siblings('.meditationSpanID').text();
                $.ajax({
                  type: 'POST',
                  url: 'https://www.intuitionlog.com/dashboard/meditation/edit',
                  data: meditationDataEdit,
                  dataType: 'json',
                  success: (meditationDataEdited) => {
                    if(meditationDataEdited.success === true) {
                      $('#addEditDeleteAJAX').empty();
                      $('#addEditDeleteAJAX').prepend(`<form id="addMeditateInfo" class="block center" action='https://www.intuitionlog.com/dashboard/meditation' method='post'> <h3 class='nowEditing'>Now editing meditation ${meditationDataEdited.data.meditationName}</h3> <div class='hidden'> <input type='text' id='_id' name='_id' value='${meditationDataEdited.data._id}'> </div><div class='input name'> <label for='name'>Name: </label> <input type='text' id='name' name='name' placeholder='Enter the name (optional)' value='${meditationDataEdited.data.meditationName}'> <span>Enter your meditation name. If no name is provided one will be generated.</span> </div><div class='input type'> <label for='meditationtype'>Type: </label> <select id='meditationtype' name='meditationtype' value='${meditationDataEdited.data.meditationType}'> <option value='Focus'>Focus</option> <option value='Guided'>Guided</option> <option value='LovingKindness'>Loving Kindness</option> <option value='Mantra'>Mantra</option> <option value='Mindfulness'>Mindfulness</option> <option value='Monitoring'>Monitoring</option> <option value='Presence'>Presence</option> <option value='Qigong'>Qigong</option> <option value='Selfinquiry'>Self-Inquiry</option> <option value='Sufi'>Sufi</option> <option value='Taoist'>Taoist</option> <option value='Transcendental'>Transcendental</option> <option value='Vipassana'>Vipassana</option> <option value='Walking'>Walking</option> <option value='Yoga'>Yoga</option> <option value='Zazen'>Zazen</option> </select> </div><div id='meditationInfo'> </div><div class='input duration'> <label for='duration'>Duration: </label> <input type='number' id='duration' name='duration' placeholder='Enter the duration' required='required' min='0' max='1440' step='1' value='${meditationDataEdited.data.meditationDuration}'> <span>Enter your meditation time in minutes</span> </div><div class='input'> <div id="meditationRatingWrapper"> <label for='meditationRating' id='meditatingRatingLabel'>Rating: </label> <div id='meditationRating'> <img id='star1' class='star star1' src='https://www.intuitionlog.com/img/star1.png'> <img id='star2' class='star star2' src='https://www.intuitionlog.com/img/star2.png'> <img id='star3' class='star star3' src='https://www.intuitionlog.com/img/star1.png'> <img id='star4' class='star star4' src='https://www.intuitionlog.com/img/star2.png'> <img id='star5' class='star star5' src='https://www.intuitionlog.com/img/star1.png'> <img id='star6' class='star star6' src='https://www.intuitionlog.com/img/star2.png'> <img id='star7' class='star star7' src='https://www.intuitionlog.com/img/star1.png'> <img id='star8' class='star star8' src='https://www.intuitionlog.com/img/star2.png'> <img id='star9' class='star star9' src='https://www.intuitionlog.com/img/star1.png'> <img id='star10' class='star star10' src='https://www.intuitionlog.com/img/star2.png'> </div><button id='resetStars' class='block center bright colorMedium'>Reset Rating</button> </div><div class='input date'> <label for='date'>Date</label> <input type='date' id='date' name='date'> <label for='time'>Time</label> <input type='time' id='time' name='time'> </div><div id='ratingWrapper' class='input'> <label for='rating'>Rating: </label> <input type='number' id='rating' name='rating' min='0' max='5' step='0.5' value='${meditationDataEdited.data.meditationRating}'> </div><div class='input notes'> <label for='notes'>Notes</label> <textarea rows='4' cols='50' id='notes' name='notes' placeholder='Enter your notes here.'>${meditationDataEdited.data.meditationNotes}</textarea> </div><button class='blueBTN' id='submitMeditation' name='submit' value='submit'>Save Changes</button> <div id="meditationErrors"> </div><div id="meditationWarnings"> </div>`);

                      $('#resetStars').click((e) => {e.preventDefault();e.stopPropagation();resetStars();});
                      
                      // Generates star images and rating values, and enable error checking
                      intervalChecks; // checks every 5 seconds for javascript form validation errors
                      generateStars(); // generates stars pre-filled based on val
                      waitForElementLoad('#submitMeditation', function() {
                        clickStar(meditationDataEdited.data.meditationRating);
                      });

                      // Post new edit form values to the server
                      $('#submitMeditation').click((e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        let scrollPos = $(window).scrollTop();
                        let meditationDataEditSubmit = {};
                        meditationDataEditSubmit.id = $('#_id').val();
                        meditationDataEditSubmit.name = $('#name').val();
                        meditationDataEditSubmit.type = $('#meditationtype').children("option:selected").val();
                        meditationDataEditSubmit.date = $('#date').val();
                        meditationDataEditSubmit.time = $('#time').val();
                        meditationDataEditSubmit.duration = $('#duration').val();
                        meditationDataEditSubmit.rating = $('#rating').val();
                        meditationDataEditSubmit.notes = $('textarea#notes').val();

                        // Prevent default submit action for type button
                        $('#resetStars').click((e) => {e.preventDefault;e.stopPropagation;resetStars();});

                        $.ajax({
                          type: 'POST',
                          url: 'https://www.intuitionlog.com/dashboard/meditation/editSubmit',
                          data: meditationDataEditSubmit,
                          dataType: 'json',
                          success: (meditationDataEditSubmitted) => {
                            if(meditationDataEditSubmitted.success === true) {
                              waitForElementLoad('#submitMeditation', function() {
                                $('html, body').animate({scrollTop: scrollPos}, 300);
                                $('#submitMeditation').after(`<span class='meditationSuccessAdd'>Successfully Updated<span>`);
                                $('.nowEditing').text(`Now Editing: ${meditationDataEditSubmit.name}`);
                                $('.meditationSuccessAdd').click((function() {$(this).remove();}));
                                $('.meditationSuccessAdd').fadeOut(5000);
                              });
                            } else {
                              $('#meditationErrors').empty();
                              let meditationEditedErrList = [];
                              waitForElementLoad('#submitMeditation', function() {
                                $('html, body').animate({scrollTop: scrollPos}, 300);
                                if(meditationDataEditSubmitted.meditationErr || meditationDataEditSubmitted.meditationCustomErr) {
                                  if(meditationDataEditSubmitted.meditationErr) {
                                    meditationDataEditSubmitted.meditationErr.forEach((err) => {
                                      meditationEditedErrList.push(`<span class='meditationErrors'>${err.msg}</span>`);
                                    });

                                    // Convert list of errors to string
                                    let meditationEditedErrListString = meditationEditedErrList.toString();
                                    let meditationEditedErrListReplaced = meditationEditedErrListString.replace(/,/g,'');
                                    $('#meditationErrors').prepend(`${meditationEditedErrListReplaced}`);
                                  } else {
                                    if(meditationDataEditSubmitted.meditationCustomErr) {
                                      meditationDataEditSubmitted.meditationCustomErr.forEach((errMsg) => {
                                        meditationEditedErrList.push(`<span class='meditationErrors'>${errMsg.msg}</span>`);
                                      });
  
                                      // Convert list of errors to string
                                      let meditationEditedErrListString = meditationEditedErrList.toString();
                                      let meditationEditedErrListReplaced = meditationEditedErrListString.replace(/,/g,'');
                                      $('#meditationErrors').prepend(`${meditationEditedErrListReplaced}`);
                                    }
                                    
                                  }
                                }
               
                            });
                          }
                          },
                          error: function (xhr, ajaxOptions, thrownError) {
                            //alert(xhr.status);
                            //alert(thrownError);
                          }
                        });

                      });
                    } else if(meditationDataEdited.success === false) {
                      // Grab all error messages and display them
                      $('#meditationErrors').empty();
                      // Add errors to an array from meditationErr object, then convert the array to a string to use for HTML display
                      let meditationErrors = [];
                      for(z = 0; z <= meditationDataEdited.meditationErr.length; z++) {
                        meditationErrors.push(`<span class='meditationErrors'>${meditationDataEdited.meditationErr.msg}</span>`)
                      }

                      // Convert array to string
                      let meditationErrString = meditationErrors.toString();

                      // Replace commas
                      meditationErrStrReplaced = meditationErrString.replace(/,/g,'');
                      $('#meditationErrors').prepend(meditationErrStrReplaced);
                    } else {
                      // Do nothing
                    }
                  },
                  error: function (xhr, ajaxOptions, thrownError) {
                    //alert(xhr.status);
                    //alert(thrownError);
                  }
                });
            });
            } else {
              // No data exists, display no data found html
              $('#addEditDeleteAJAX').empty();
              $('#addEditDeleteAJAX').prepend(`
                <div id='noMeditationsFound' class='center block relative'>
                <h1>It looks like there are no meditations added yet.</h1>
                <p>To add meditations select the ADD button above and fill out the form.</p>
                </div>`);
            }
            
          } else if(data.success === false) {
            // Grab all error messages and display them
            
            // Add errors to an array from meditationErr object, then convert the array to a string to use for HTML display
            data.meditationErr.forEach((errName) => {
              meditationErrors.push(`<span class='meditationErrors'>${errName.msg}</span>`);
            });
          } else {
            // do nothing
          }
          
        },
          error: function (xhr, ajaxOptions, thrownError) {
            //alert(xhr.status);
            //alert(thrownError);
        }
      })
    });

    $('.meditationDelete').click((event) => {
      event.preventDefault();
      event.stopPropagation();

      let dataDelete = {};
      $.ajax({
        type: 'POST',
        url: 'https://www.intuitionlog.com/dashboard/meditation/view',
        data: dataDelete,
        dataType: 'json',
        success: (dataDeleteSuccess) => {
          if(dataDeleteSuccess.success === true) {
            $('#addEditDeleteAJAX').empty();
            // Check if there are any returned results
            if(dataDeleteSuccess.data.length > 0) {
              // Data exists, show list of results
              let readableTime = undefined;
              for(let a = 0; a < dataDeleteSuccess.data.length; a++) {
                // Prevent nothing from showing if invalid date exists
                if(dataDeleteSuccess.data[a].date) {
                  let dbDate = new Date(dataDeleteSuccess.data[a].date);
                  readableTime = dbDate.toISOString().replace(/T/, ' ').replace(/\..+/, '');
                  readableTime = readableTime.slice(0, -3);
                  if(isValidDate(dbDate)) {} else {
                    readableTime = 'Missing Date';
                  };
                } else {
                  readableTime = 'Missing Date';
                }
                
                
                
                $('#addEditDeleteAJAX').prepend(`<div class='meditationEntryWrapperDel'>
                <div class="meditationEntry">
                  <div class="meditationEntry">
                    <span class='meditationSpanDel meditationSpanID hidden'>${dataDeleteSuccess.data[a]._id}</span>
                    <span class='meditationSpanDel'> ${dataDeleteSuccess.data[a].meditationName} </span>
                    <span class='meditationSpanDel'> ${readableTime} </span>
                    <span class='meditationSpanDel'><span class='deleteMeditation'>DELETE</span><span>
                  </div>
                </div>
              </div>
              `);
              }
            
              // disable error checking interval while on the edit meditation screen
              clearInterval(intervalChecks);
              // Send data to be deleted
              let meditationDataDelete = {};
              $('.deleteMeditation').click(function() {
                meditationDataDelete.id = $(this).parent().siblings('.meditationSpanID').text();

                $.ajax({
                type: 'POST',
                url: 'https://www.intuitionlog.com/dashboard/meditation/delete',
                data: meditationDataDelete,
                dataType: 'json',
                success: (meditationDataDeleted) => {
                  // Success, reload data in the delete section
                  console.log(meditationDataDeleted);
                  waitForElementLoad('.meditationDelete', function() {
                    $('.meditationDelete').trigger('click');
                  });
                  
                },
                error: function (xhr, ajaxOptions, thrownError) {
                  //alert(xhr.status);
                  //alert(thrownError);
                }
              });
              });
                
              
            } else {
              // No data exists, display no data found html
              $('#addEditDeleteAJAX').empty();
              $('#addEditDeleteAJAX').prepend(`
                <div id='noMeditationsFound' class='center block relative'>
                <h1>It looks like there are no meditations added yet.</h1>
                <p>To add meditations select the ADD button above and fill out the form.</p>
                </div>`);
            }
          } else {
            // Grab all error messages and display them
            
            // Add errors to an array from meditationErr object, then convert the array to a string to use for HTML display
            data.meditationErr.forEach((errName) => {
              meditationErrors.push(`<span class='meditationErrors'>${errName.msg}</span>`);
            });
          }
        },
        error: function (xhr, ajaxOptions, thrownError) {
          //alert(xhr.status);
          //alert(thrownError);
        }
    });
  });

    // Add event listener to dynamically create HTML
    $('#submitMeditation').click(function(event) {
      event.preventDefault();
      event.stopPropagation();

      // Add ajax to document form post
      // Collect data from html element values
      let data = {};
      let meditationErrors = [];
      let scrollPosA = $(window).scrollTop();
      data.name = $('#name').val();
      data.type = $('#meditationtype').val();
      data.duration = $('#duration').val();
      data.rating = $('#rating').val();
      data.notes = $('textarea#notes').val();
      data.date = $('#date').val();
      data.time = $('#time').val();

      $.ajax({
          type: 'POST',
          url: 'https://www.intuitionlog.com/dashboard/meditation',
          data: data,
          dataType: 'json',
          success: (data) => {
              //console.log(data);
              if(data.success === true) {
                // Get scroll position, on reload go to scroll position
                
                $('#dashboard').empty();
                $('#meditation').trigger('click'); // Somehow fixes double posting issues
                waitForElementLoad('#submitMeditation', function() {
                  $('html, body').animate({scrollTop: scrollPosA}, 300);
                  $('#submitMeditation').after(`<span class='meditationSuccessAdd'>Successfully Added<span>`);
                  $('.meditationSuccessAdd').click((function() {$(this).remove();}));
                  $('.meditationSuccessAdd').fadeOut(5000);
                  
                });


                
              } else if(data.success === false) {
                // Grab all error messages and display them
                $('#meditationErrors').empty();
                // Add errors to an array from meditationErr object, then convert the array to a string to use for HTML display
                if(data.meditationErr) {
                  data.meditationErr.forEach((errName) => {
                    meditationErrors.push(`<span class='meditationErrors'>${errName.msg}</span>`);
                  });
                }
                
                if(data.meditationCustomErr) {
                  data.meditationCustomErr.forEach((custErrName) => {
                    if(custErrName.dateMsg) {
                      meditationErrors.push(`<span class='meditationErrors'>${custErrName.dateMsg}</span>`);
                    } else if(custErrName.ratingMsg) {
                      meditationErrors.push(`<span class='meditationErrors'>${custErrName.ratingMsg}</span>`);
                    } else if (custErrName.notesMsg) {
                      meditationErrors.push(`<span class='meditationErrors'>${custErrName.notesMsg}</span>`);
                    } else if(customErrName.typeMsg) {
                      meditationErrors.push(`<span class='meditationErrors'>${custErrName.typeMsg}</span>`);
                    } else {}
                    
                  });
                }
                

                // Convert array to string
                let meditationErrString = meditationErrors.toString();

                // Replace commas
                meditationErrStrReplaced = meditationErrString.replace(/,/g,'');
                $('#meditationErrors').prepend(meditationErrStrReplaced);
              } else {
                // do nothing
              }
              
          },
          error: function (xhr, ajaxOptions, thrownError) {
            //alert(xhr.status);
            //alert(thrownError);
          }
      });
    });

    // Share on facebook JS SDK trigger for submenu on meditation page
    $('#medShare').click(function() {
        FB.ui({
        method: 'share',
        href: 'https://www.facebook.com/IntuitionLog-195738501309259/',
      }, function(response){});
    });

    
  });
});

// READING MODULE
$('#readings, .readings').click(function() {
  $.get('https://www.intuitionlog.com/html/readings.html', function(data, status) {
    let readingPage = data;
    $('#dashboard').empty();
    $('#dashboard').prepend(readingPage);
    
});
});

// ACCOUNT MODULE
// Set success outside scope of AJAX in order to update successful posts while deleting content that created said posts
let accEditSuccess = false;
$('#account, .account').click(function() {
  console.log(accEditSuccess);
  $.get('https://www.intuitionlog.com/html/account/account.html', (data, status) => {
    // Make a post request to retrieve account data and post it into the view
    let acc = {}; // blank on purpose, no need to send data to retrieve account info
    let accountPage = data;
    
    $.ajax({
      type: 'POST',
        url: 'https://www.intuitionlog.com/dashboard/account',
        data: acc,
        dataType: 'json',
        success: (accResults) => {
            if(accResults.success === true) {
              // Fill fields with account data
              // Set view information
              $('#accountUsernameInfo span:nth-of-type(2)').text(accResults.data.username);
              $('#accountNameInfo span:nth-of-type(2)').text(accResults.data.name);
              $('#accountEmailInfo span:nth-of-type(2)').text(accResults.data.email);
              $('#accountAgeInfo span:nth-of-type(2)').text(accResults.data.age);
              $('#accountAddressInfo span:nth-of-type(2)').text(accResults.data.address1);
              $('#accountAddressInfo span:nth-of-type(4)').text(accResults.data.address2);
              $('#accountAddressInfo span:nth-of-type(6)').text(accResults.data.city);
              $('#accountAddressInfo span:nth-of-type(8)').text(accResults.data.state);
              $('#accountAddressInfo span:nth-of-type(10)').text(accResults.data.zip);
              
              // Set form information prefill
              $('#accountNameField input').attr('placeholder', accResults.data.name);
              $('#accountEmailField input').attr('placeholder', accResults.data.email);
              $('#accountAgeField input').attr('placeholder', accResults.data.age);
              $('#accountAddress1').attr('placeholder', accResults.data.address1);
              $('#accountAddress2').attr('placeholder',accResults.data.address2);
              $('#accountCity').attr('placeholder', accResults.data.city);
              $('#accountState').attr('placeholder', accResults.data.state);
              $('#accountZip').attr('placeholder', accResults.data.zip);
              // Set image property
              $('#accountImgInfo img').attr('src', accResults.data.image);

              $('#accountNameField input').val(accResults.data.name);
              $('#accountEmailField input').val(accResults.data.email);
              $('#accountAgeField input').val(accResults.data.age);
              $('#accountAddress1').val(accResults.data.address1);
              $('#accountAddress2').val(accResults.data.address2);
              $('#accountCity').val(accResults.data.city);
              $('#accountState').val(accResults.data.state);
              $('#accountZip').val(accResults.data.zip);

              // Set meditation info prefill
              $('#accountMedHrsInfo span:nth-of-type(2)').text(Math.round(accResults.info.medDurTotal / 60));
              $('#accountMedComplInfo span:nth-of-type(2)').text(accResults.info.totalMeds);

              // Show success msg
              if(accEditSuccess == true) {
                $('#accountSuccess').text('Successfully updated');
                $('#accountSuccess').show();
              }
              
            } else if(accResults.success === false) {
              // Check if err was passed
              console.log(accResults);
              if(accResults.errMsg) {
                accEditSuccess = false;
                $('#accountErr').text(accResults.errMsg);
                $('#accountErr').show();
              }
            } else {
              //
            }
  
          },
          error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status);
            alert(thrownError);
          }
        });
    $('#dashboard').empty();
    $('#dashboard').prepend(accountPage);

    // Clear Interval Checking for errors from meditation page
    clearInterval(intervalChecks);

    // Set minimum height for page and page resizes
    setAccPageMinHeight('#accountPage');
    $(window).resize(setAccPageMinHeight('#accountPage'));

    // If img button is clicked, do nothing and trigger the input click as desired
    $('#accountImgField button:nth-of-type(1)').click(function(e) {
      e.preventDefault();
      $('#accountImgField input').trigger('click');
    });

    // If submit button is clicked, perform ajax post of image data
    $('#updateAccImg').submit(function(e) {
      e.preventDefault();
    
      var fd = new FormData();
      var files = $('#accountImgUpload')[0].files[0];
      fd.append('file',files);

      $.ajax({
        type: 'POST',
          url: 'https://www.intuitionlog.com/dashboard/accountupdateimg',
          data: fd,
          contentType: false,
          processData: false,
          success: (response) => {
            // Check if response success exists, if so throw success, else throw error
            if(response.success == true) {
              // Show success msg
                $('#accountSuccess').text('Image Updated');
                $('#accountSuccess').show();
              // Clear image file from upload
            } else if(response.success == false) {
              console.log(response);
              // Throw error
              if(response.errMsg) {
                  accEditSuccess = false;
                  $('#accountErr').text(response.errMsg);
                  $('#accountErr').show();
                
              }
            } else {}
          },
          error: function (xhr, ajaxOptions, thrownError) {
            //alert(xhr.status);
            //alert(thrownError);
          }
      });
    });

    // Turn off data view, turn on edit view
    $('#changeInfo').click(function(e) {
      e.preventDefault();

      if($('#changeInfo').text() == 'Save Changes') {
        // Post data
        let updateAcc = {};
        updateAcc.img = $('#accountImgField input').val();
        updateAcc.name = $('#accountNameField input').val();
        updateAcc.email = $('#accountEmailField input').val();
        updateAcc.age = $('#accountAgeField input').val();
        updateAcc.addr1 = $('#address1Section input').val();
        updateAcc.addr2 = $('#address2Section input').val();
        updateAcc.city = $('#citySection input').val();
        updateAcc.state = $('#stateSection input').val();
        updateAcc.zip = $('#zipSection input').val();

        $.ajax({
          type: 'POST',
            url: 'https://www.intuitionlog.com/dashboard/accountupdate',
            data: updateAcc,
            dataType: 'json',
            success: (updateAccResults) => {
              console.log('check 1');
                if(updateAccResults.success === true) {
                  console.log('check 2');
                  console.log(updateAccResults);

                  // Reload data and display success message
                  $('#account').trigger('click');
                  accEditSuccess = true;
                  
                } else if(updateAccResults.success === false) {
                  console.log('check 3');
                  // Check if err was passed
                  if(updateAccResults.errMsg) {
                    console.log('check 4');
                    console.log(updateAccResults.errMsg);
                   
                  } else if(updateAccResults.warningMsgs) {
                    console.log('check 5');
                    console.log(updateAccResults.warningMsgs);
                    $('#accountErr').text();
                    for(let warnMsg = 0; warnMsg < updateAccResults.warningMsgs.length; warnMsg ++) {
                      $('#accountErr').prepend(`<span>${updateAccResults.warningMsgs[warnMsg].msg}</span>`);
                    }
                    // Show accountErr once messages are populated
                    $('#accountErr').show();
                  } else {
                    // do nothing
                  }
                } else {
                  // do nothing
                }
      
              },
              error: function (xhr, ajaxOptions, thrownError) {
                alert(xhr.status);
                alert(thrownError);
              }
            });

      } else {
        // Change info over to be ready for posting
        $('.info, .contentWrapper2').hide();
        $('.field').show();
        $(this).text('Save Changes');

        // hide success message if exists
        $('#accountSuccess').hide();
        accEditSuccess = false;
      }

    });

    // Turn off edit view, turn on data view
    $('#resetInfo').click(function(e) {
      e.preventDefault();
      $('.field').hide();
      $('.info, .contentWrapper2').show();
      $('#changeInfo').text('Edit Information');

      // hide success message if exists
      $('#accountSuccess').hide();
      $('#accountErr').hide();
      accEditSuccess = false;
    });

    // Load when account page is ready
    waitForElementLoad('#accountPage', function() {
      setTimeout(function(){$('#accountPage').show()}, 100);
    });
    waitForElementLoad('#buddyPage', function() {
      setTimeout(function(){$('#buddyPage').show()}, 100);
    });

    // Checks for errors live on the page
    $('input').keyup(function() {
      let value = $(this).val();
      let regCheck = new RegExp(/^[A-Za-z0-9@-` .']+$/i);
      if(value == '') {
        // do nothing, they chose not to fill in information, optional
        $(this).next().text('');
        $(this).next().attr('style', 'display: none');
        $('#accountErr').hide();
      } else {
        // Check if values are alphanumeric with spaces
        if(regCheck.test(value)) {
          $(this).next().text('');
          $(this).next().attr('style', 'display: none');
          $('#accountErr').hide();
        } else {
          $(this).next().text("Must contain the characters A-Z, 0-9 or @-`.");
          $(this).next().attr('style', 'display: block');
        }
      }
    });

    // Hides success / error messages when clicked
    $('#accountSuccess').click(function() {$(this).hide()});

});
});
// LOGOUT MODULE
$('#logout, .logout').click(function() {
  window.location.href = 'https://www.intuitionlog.com/dashboard/logout';
});

/********** HOISTED FUNCTION CALLS AND OTHER VARIABLES */

// Used to initially load the meditation page on page load
$('#meditation').trigger('click');});

// Window resize functions
$(window).resize(function() {
  // Set new window height
  height = window.innerHeight;
  winWidth = window.innerWidth;

  // Set chart dimensions
  let dashboardWidth = $('#dashboard').width();
  if(winWidth < 576) {
    $('#meditationChart').width(dashboardWidth);
    $('#meditationChart').height('200px');
  } else {
    $('#meditationChart').width(dashboardWidth);
    $('#meditationChart').height('300px');
  }

  // Always set navigation height to window height
  navigation.style.height = window.innerHeight + 'px';
});

// Load element when available HELPER FUNCTION
var waitForElementLoad = function(selector, callback) {
  if (jQuery(selector).length) {
    callback();
  } else {
    setTimeout(function() {
      waitForElementLoad(selector, callback);
    }, 100);
  }
};

// Load friends list function
let loadFriendsList = function() {
  let frData = {};
  $.ajax({
  type: 'POST',
    url: 'https://www.intuitionlog.com/dashboard/meditation/friends',
    data: frData,
    dataType: 'json',
    success: (frResults) => {
      $('#searchControls').remove();
      $('#friendsResults').empty();
      if(frResults) {
        if(frResults.success == true) {
          if(frResults.frResults) {
          let friendList = Object.values(frResults.frResults);
          for(let x = 0; x < friendList.length; x++) {
            $('#friendsResults').append(`
              <div class='friendListWrapper'>
                <span class='friendListItem'>${friendList[x][0]}</span>
                <span class='friendListItem'>${friendList[x][1]}</span>
                <span class='friendListItem'>${friendList[x][2]}</span>
              </div>
            `);
          }
        } else {
          $('#friendsResults').append(`<h1>${frResults.errMSG}</h1>`);
        }
      } else {
        $('#friendsResults').append(`<h1>${frResults.errMSG}</h1>`);
      }
    }
    },
    error: function (xhr, ajaxOptions, thrownError) {
      //alert(xhr.status);
      //alert(thrownError);
    }
});
}

// Load friends search function
let loadFriendsSearch = function() {
  let frFind = {};
  frFind.searchStr = $('#searchControls input').text();
  $('#friendsResults').empty();
  $.ajax({
    type: 'POST',
      url: 'https://www.intuitionlog.com/dashboard/meditation/friendsearch',
      data: frFind,
      dataType: 'json',
      success: (frFindData) => {
        if(frFindData) {
          if(frFindData.success == true) {
            if(frFindData.frFindResults) {
            let friendList = Object.values(frFindData.frFindResults);
            // Build search elements
            $('#friendsResults').before(`
              <div id='searchControls'>
                <input type='text' />
                <span class='searchBTN'>Search</span>
              </div>
            `);

            // Generate matches
            for(x = 0; x < friendList.length; x++) {
              $('#friendsResults').append(`
                <div id='userSearchWrapper'>
                  <a class='userSearchItem hidden'>${friendList[x]._id}</a>
                  <span class='userSearchItem'><img src='${friendList[x].image}'></img></span>
                  <span class='userSearchItem'>${friendList[x].name}</span>
                  <span class='userSearchItem add'>Add</span>
                </div>
              `);
            }

            // Send friend request on click
            $('.add').click(function() {
              
            });
          } else {
            $('#friendsResults').append(`<h1>${frFindData.errMSG}</h1>`);
          }
        } else {
          $('#friendsResults').append(`<h1>${frFindData.errMSG}</h1>`);
        }
      }
      },
      error: function (xhr, ajaxOptions, thrownError) {
        //alert(xhr.status);
        //alert(thrownError);
      }
  });
}

// Send friend request function
let sendFriendRequest = function(element) {
  let frAdd = {};
  frAdd.friendID = element.siblings('a').text();
  $.ajax({
    type: 'POST',
      url: 'https://www.intuitionlog.com/dashboard/meditation/friendadd',
      data: frAdd,
      dataType: 'json',
      success: (frAddResults) => {
        if(frAddResults.success == true) {
          // Successfully appended
          $('.frSucMSG').remove();
          element.after(`<span class='frSucMSG'>Successfully Added</span>`);
        } else if(frAddResults.success == false) {
          // Not appended, already exists
          $('.frErrMSG').remove();
          element.after(`<span class='frErrMSG'>${frAddResults.errMSG}</span>`);
        }
      },
      error: function (xhr, ajaxOptions, thrownError) {
        //alert(xhr.status);
        //alert(thrownError);
      }
    });
}

// Declare function to set minimum page height for selected element
let setAccPageMinHeight = function(element) {
  $(element).css('min-height', window.innerHeight + 'px');
}

// Checks if a date is valid
let isValidDate = function(d) {
  return d instanceof Date && !isNaN(d);
}

// Set function to clear stars back to default
let resetStars = () => {
  $('#star1, #star3, #star5, #star7, #star9').attr('src', 'https://www.intuitionlog.com/img/star1.png');
  $('#star2, #star4, #star6, #star8, #star10').attr('src', 'https://www.intuitionlog.com/img/star2.png');
  $('#rating').val(undefined);
}

// Check rating of loaded elements and click corresponding star to rating value
let clickStar = (rating) => {
  switch(rating) {
    case 0.5:
    $('#star1').trigger('click');
    break;

    case 1:
    $('#star2').trigger('click');
    break;

    case 1.5:
    $('#star3').trigger('click');
    break;
    
    case 2:
    $('#star4').trigger('click');
    break;

    case 2.5:
    $('#star5').trigger('click');
    break;

    case 3:
    $('#star6').trigger('click');
    break;

    case 3.5:
    $('#star7').trigger('click');
    break;

    case 4:
    $('#star8').trigger('click');
    break;

    case 4.5:
    $('#star9').trigger('click');
    break;

    case 5:
    $('#star10').trigger('click');
    break;

    default:
    $('#resetStars').trigger('click');
    break;
  }
}

// When stars are clicked on the front end, set the rating value accordingly.
// THIS operator not working after XHR calls
let generateStars = function() {
  // Reset stars before continuing
  resetStars();

  $('#star1').click(function() {
    resetStars();
    $('#star1').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#rating').val('0.5');
  });

  $('#star2').click(() => {
    resetStars();
    $('#star1').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star2').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#rating').val('1.0');
  });

  $('#star3').click(() => {
    resetStars();
    $('#star1').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star2').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star3').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#rating').val('1.5');
  });

  $('#star4').click(() => {
    resetStars();
    $('#star1').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star2').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star3').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star4').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#rating').val('2.0');
  });

  $('#star5').click(() => {
    resetStars();
    $('#star1').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star2').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star3').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star4').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star5').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#rating').val('2.5');
  });

  $('#star6').click(() => {
    resetStars();
    $('#star1').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star2').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star3').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star4').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star5').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star6').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#rating').val('3.0');
  });

  $('#star7').click(() => {
    resetStars();
    $('#star1').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star2').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star3').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star4').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star5').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star6').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star7').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#rating').val('3.5');
  });

  $('#star8').click(() => {
    resetStars();
    $('#star1').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star2').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star3').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star4').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star5').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star6').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star7').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star8').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#rating').val('4.0');
  });

  $('#star9').click(() => {
    resetStars();
    $('#star1').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star2').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star3').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star4').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star5').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star6').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star7').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star8').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star9').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#rating').val('4.5');
  });

  $('#star10').click(() => {
    resetStars();
    $('#star1').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star2').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star3').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star4').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star5').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star6').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star7').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star8').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#star9').attr('src', 'https://www.intuitionlog.com/img/star3.png');
    $('#star10').attr('src', 'https://www.intuitionlog.com/img/star4.png');
    $('#rating').val('5.0');
  });
}

let drawMeditationChart = function() {
  // Get current day
  let meditationDays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  let meditationMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  let meditationDaysArr = [];
  let meditationToday = new Date();
  let day = meditationDays[ meditationToday.getDay() ];
  let month = meditationMonths[ meditationToday.getMonth() ];
  let todayIndex = meditationDays.indexOf(day);
  let monthIndex = meditationMonths.indexOf(month);
  // Loop through the available indexes based on todayIndex to get list for day
  // Take values higher than index and put them into meditationDaysArr first
  for(let x = todayIndex + 1; x < meditationDays.length; x++) {
    meditationDaysArr.push(meditationDays[x]);
  }
  // Take values from todayIndex to pick up the rest of the array values
  for(let y = 0; y <= todayIndex; y++) {
    meditationDaysArr.push(meditationDays[y]);
  }

  // Make a post to the server to grab the last 7 days of meditations
  let meditationGetChart = {};
  meditationGetChart.meditationToday = new Date().toISOString();
  $.ajax({
    type: 'POST',
      url: 'https://www.intuitionlog.com/dashboard/meditation/getchart',
      data: meditationGetChart,
      dataType: 'json',
      success: (meditationGetChartResults) => {
          //console.log(data);
          if(meditationGetChartResults.success === true) {
            // Get all 7 days worth of meditation hours and send them to be drawn
            const addMedMins = (a,b) => a + b;
            
            let meditationDay0Minutes = meditationGetChartResults.meditationDay0Arr.reduce(addMedMins,0);
            let meditationDay1Minutes = meditationGetChartResults.meditationDay1Arr.reduce(addMedMins,0);
            let meditationDay2Minutes = meditationGetChartResults.meditationDay2Arr.reduce(addMedMins,0);
            let meditationDay3Minutes = meditationGetChartResults.meditationDay3Arr.reduce(addMedMins,0);
            let meditationDay4Minutes = meditationGetChartResults.meditationDay4Arr.reduce(addMedMins,0);
            let meditationDay5Minutes = meditationGetChartResults.meditationDay5Arr.reduce(addMedMins,0);
            let meditationDay6Minutes = meditationGetChartResults.meditationDay6Arr.reduce(addMedMins,0);

            // Generate chart using array from created dates above
            let ctx = document.getElementById('meditationChart').getContext('2d');
            let meditationChart = new Chart(ctx, {
              type: 'line',
              data: {
                labels: meditationDaysArr,
                datasets: [{ 
                    data: [meditationDay6Minutes, meditationDay5Minutes, meditationDay4Minutes, meditationDay3Minutes, meditationDay2Minutes, meditationDay1Minutes, meditationDay0Minutes],
                    label: "Meditation Time in Minutes",
                    borderColor: "#3e95cd",
                    fill: true,
                    borderWidth: 1
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                  display: true,
                  position: 'top',
                  labels: {
                    fontColor: 'navy',
                    defaultFontSize: 16
                  }
                }
              }
            });
          }
        },
        error: function (xhr, ajaxOptions, thrownError) {
          alert(xhr.status);
          alert(thrownError);
        }
  });
  
}

let intervalChecks = setInterval(() => {
  /***************** DURATION VALIDATION CHECK */
  // Check if an error message already exists
  if($('#duration').val() === "1") {
    $('#meditationWarnings').empty();
    // Duration hasn't been changed yet, do nothing
  } else if($('#duration').val() === '') {
    $('#meditationWarnings').empty();
    $('#meditationWarnings').prepend('<span class="meditationWarnings invalidDuration">Warning: Duration must be a whole number in minutes.</span>');
  } else {
    // Durations value has changed, check for errors
    if(!$('#meditationWarnings .invalidDuration').length) {
      // No error message exists, check and create
      let durationToInt = parseInt($('#duration').val());
      if(isNaN(durationToInt)) {
        $('#meditationWarnings').empty();
        $('#meditationWarnings').prepend('<span class="meditationWarnings invalidDuration">Warning: Duration must be a number.</span>');
      } else {
        // Cast the string value into a number for comparison
        if(parseInt($('#duration').val()) > 1 && parseInt($('#duration').val()) < 1440) {
          // Do nothing
          $('#meditationWarnings').empty();
        } else {
          $('#meditationWarnings').empty();
          $('#meditationWarnings').prepend('<span class="meditationWarnings invalidDuration">Warning: Duration must be between 1 and 1440</span>');
        }
        
        let validDuration = new RegExp(/^[0-9]+$/i);
        if(!validDuration.test($('#duration').val())) {
          $('#meditationWarnings').empty();
          $('#meditationWarnings').prepend('<span class="meditationWarnings invalidDuration">Warning: Duration must be a number</span>');
        }
      }
    }
  }
  
  /***************** RATING VALIDATION CHECK */
  if($('#rating').length > 0) {
    let validRating = new RegExp(/^[0-5.]+$/i);
    if(!validRating.test($('#rating').val())) {
      // Not valid, check if error message is created, if not create one
      if($('#meditationWarnings .invalidRating').length) {
        // error message exists, do nothing
      } else {
        $('#meditationWarnings').prepend('<span class="meditationWarnings invalidRating">Warning: Only ratings of 0.0 - 5.0 allowed </span>');
      }
    } else {
      if($('#meditationWarnings .invalidRating').length) {
        $('#meditationWarnings').empty();
      }
    }

    if(($('#rating').val().length == 3 || $('#rating').val().length == 1)) {
      if($('#rating').val() > 0 && $('#rating').val() <= 5.0) {
        // No issues, everything is within parameters
      } else {
        // Check if an error message has been created, if not create one
        if(!$('#meditationWarnings .invalidRatingLength').length) {
          // Error doesn't exist, create one
          $('#meditationWarnings').prepend('<span class="meditationWarnings invalidRatingLength">Warning: Only ratings of 0.0 - 5.0 allowed</span>');
        } else {
          $('#meditationWarnings').empty();
        }
      }
    }
    }


    /***************** TEXT AREA VALID CHARACTER CHECK */
  if($('textarea#notes').length > 0) {
    // If textarea notes even exists
    if($('textarea#notes').val().length > 1) {
      let validChars = new RegExp(/^[A-Za-z0-9@!#$%*+-/=?^_` .{]+$/i);
      if(!validChars.test($('textarea#notes').val())) {
        if($('#meditationWarnings .invalidtext').length) {
          // error message exists, do nothing
        } else {
          $('#meditationWarnings').prepend('<span class="meditationWarnings invalidtext">Warning: Letters, numbers or @!#$%*+-/=?^_`.{ allowed.</span>');
        }
      } else {
        if($('#meditationWarnings .invalidtext').length) {
          $('#meditationWarnings').empty();
        }
      }
  
      /***************** TEXT AREA LENGTH CHECK */
      if($('textarea#notes').val().length > 5000) {
        if($('#meditationWarnings .charLimit').length) {
          // error message exists, do nothing
        } else {
          // error doesn't exist yet, create one
          $('#meditationWarnings').prepend('<span class="meditationWarnings charLimit">Warning: Your post is over the character limit.</span>');
        }
      } else {
        if($('#meditationWarnings .charLimit').length) {
          // Remove errors that exist
          $('#meditationWarnings').empty();
        }
      }
    }
  }
  

  /***************** VALID NAME CHECK */
  if($('#name').length > 0) {
    // If name even exists, then check
    if($('#name').val().length > 1) {
      let validNameChars = new RegExp(/^[A-Za-z0-9 ]+$/i);
      if(!validNameChars.test($('#name').val())) {
        if($('#meditationWarnings .invalidNametext').length) {
          // error message exists, do nothing
        } else {
          $('#meditationWarnings').prepend('<span class="meditationWarnings invalidNametext">Warning: Letters, numbers or spaces allowed in your meditation name</span>');
        }
      } else {
        if($('#meditationWarnings .invalidNametext').length) {
          if($('#name').val().length > 1 && $('#name').val().length <= 30) {
            $('#meditationWarnings').empty();
          } else {
            // meditation name length not between 1 and 30
            $('#meditationWarnings').empty();
            $('#meditationWarnings').prepend('<span class="meditationWarnings invalidNametext">Warning: Meditation name must be under 30 characters in length.</span>');
          }
          
        }
      }
    }
  }
  

  
}, 5000);