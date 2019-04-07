$(document).ready(() => {
  // <initialization> -----------------------------------------------------------------------------------

  // ====================================================================================================
  // > Global
  // ====================================================================================================

  // Variables
  let DEBUG = true;
  let cPollOptionInput = null; // Keeps track of current .poll-option-input
  let tPollOptionInput = 2; // Keeps count of total .poll-option-input

  // Functions
  function toastAlert(message) {
    $(".toast").remove();
    M.toast({ html: message, classes: "red" });
  }
  function toastNotification(message) {
    $(".toast").remove();
    M.toast({ html: message, classes: "green" });
  }

  // Templates (for dynamic elements)
  let templateBtnPollRemove = `<a href="#" class="btn-poll-remove btn-poll-modify btn-floating btn-small grey darken-2 scale-transition scale-out">
      <i class="material-icons white-text">close</i>
    </a>`;
  let templateIconAddImageEnabled =
    '<i class="material-icons icon-add-image white-text enable-transition">add_photo_alternate</i>';
  let templateIconAddImageDisabled =
    '<i class="material-icons icon-add-image white-text disable-transition">add_photo_alternate</i>';

  // ====================================================================================================
  // > Events
  // ====================================================================================================

  InitStaticEvents();
  RefreshDynamicEvents();

  // </initialization> ----------------------------------------------------------------------------------

  // <events> -------------------------------------------------------------------------------------------

  // [Events that need to be refreshed due to dynamic elements]
  function RefreshDynamicEvents() {
    // ====================================================================================================
    // > Notification Timer
    // ====================================================================================================
    $(".notification").slideToggle(360, () => {
      setTimeout(() => {
        $(".notification").slideUp(360, () => {
          $(".notification").remove();
        });
      }, 3000);
    });

    // ====================================================================================================
    // > Materializecss Init
    // ====================================================================================================

    // Initializes/Refreshes existing .tooltipped elements
    $(".tooltipped").tooltip();

    // Adds Selection animation for poll options
    $("input:radio[name=options]").change(event => {
      // Removes any previous selected classes set
      $(".selected").removeClass("selected");
      $(".poll-image-preview.z-depth-3").removeClass("z-depth-3");

      // Grabs the nearest .poll-text and .poll-image-preview elements
      let closestRow = $(event.target).closest(".row");
      let pollText = closestRow.find(".poll-text");
      let pollImagePreview = closestRow
        .next(".row")
        .find(".poll-image-preview");
      pollImagePreview.addClass("z-depth-3");
      // Adds the .selected class to the grabbed element
      pollText.addClass("selected");
    });

    // Initializes/Refreshes existing .modal elements
    (() => {
      let elems = document.querySelectorAll(".modal");
      let instances = M.Modal.init(elems, {
        onOpenStart: () => {
          // Checks if cPollOptionInput has an existing element
          if (cPollOptionInput != null) {
            // Sets the value of the .input-set-url element to cPollOptionInput's img attribute
            $(".input-set-url").val(cPollOptionInput.attr("img"));
          }
        },
        onOpenEnd: () => {
          // Sets focus to .input-set-url element
          $(".input-set-url").focus();
          $('.input-enter-pollsion').focus();
        },
        onCloseStart: () => {
          // Resets .input-set-url element's value
          $(".input-set-url").val("");
        }
      });
    })();

    // ====================================================================================================
    // > .btn-set-url
    // ====================================================================================================

    $(".btn-set-url").off();
    $(".btn-set-url").on("click", event => {
      // Grabs value of current .input-set-url element
      let setURL = $(".input-set-url").val();

      // Closes existing .modal elements
      M.Modal.getInstance($(".modal")).close();

      // Stores grabbed value into current .poll-option-input's img attribute
      cPollOptionInput.attr("img", setURL);

      // Grabs .poll-option element containing current .poll-option-input
      let pollOption = cPollOptionInput.closest(".poll-option");

      // Grabs .icon-add-image element within current .poll-option
      let imageIcon = pollOption.find("i.icon-add-image");

      // Checks if an .icon-add-image element was grabbed
      if (imageIcon.length > 0) {
        // Replaces grabbed .icon-add-image element with <img> element containing setURL
        imageIcon.replaceWith(
          `<img src="${setURL}" class="image-preview icon-add-image">`
        );
      } else {
        // Grabs img element within current .poll-option
        let imagePreview = pollOption.find("img");

        // Changes the src of any grabbed img element within current .poll-option to setURL
        if (imagePreview) imagePreview.attr("src", `${setURL}`);
      }

      // Initializes/Refreshes dynamic events
      RefreshDynamicEvents();
    });

    // ====================================================================================================
    // > .add-url - Click
    // ====================================================================================================

    // Shows a custom modal for entering an image URL
    $(".add-url").off();
    $(".add-url").on("click", event => {
      // Check if images_switch is on
      let switchImages = $("#switch-images").prop("checked");
      if (switchImages) {
        // Grab the input element and store it as current selected input-image
        // console.log($(event.target).closest(".row"));
        cPollOptionInput = $(event.target)
          .closest(".row")
          .find("input");
      } else {
        event.preventDefault();
        // Show settings side nav
        $(".btn-settings i").trigger("click");
      }
    });

    $(".btn-enter-pollsion").off();
    $(".btn-enter-pollsion").on("click", () => {
      let url = $(".input-enter-pollsion").val();
      if (url) {
        window.location.replace(`/${url}`);
      }
    });

    $(".btn-poll-link").off();
    $(".btn-poll-link").on("click", () => {
      let copyText = document.createElement('textarea');
      copyText.value = 'localhost:5000' + $(".btn-poll-link").html();
      document.body.appendChild(copyText);
      copyText.select();
      document.execCommand('copy');
      document.body.removeChild(copyText);
      toastNotification("Copied Pollsion Link");
    });

    // Switch Event: Images
    $("#switch-images").change(event => {
      let switchImages = $("#switch-images").prop("checked");
      if (switchImages) {
        // Switch was enabled
        let element = $(".add-url");
        element.addClass("modal-trigger");
        element.find("i").replaceWith(templateIconAddImageEnabled);
        // $(event.target).trigger('click');
      } else {
        // Switch was disabled
        let element = $(".add-url");
        element.removeClass("modal-trigger");
        // Replace all <i> and <img> with the disabled templateIconAddImage
        element
          .find("i")
          .removeClass("enable-transition")
          .addClass("disable-transition");
        element.find("img").replaceWith(templateIconAddImageDisabled);
      }
      // Remove all img attr values
      let optionElements = $(".poll-option-input").toArray();
      for (let i = 0; i < optionElements.length; i++) {
        let optionElement = $(optionElements[i]);
        optionElement.attr("img", "");
      }
    });

    // Error Event: Image URL
    $("img").off();
    $("img").on("error", event => {
      let parent = $(event.target)
        .parent()
        .parent()
        .parent()
        .parent();
      let cPollOptionInput = parent.find("input");
      if (cPollOptionInput.attr("img").length > 0) {
        toastAlert("Image not found");
        cPollOptionInput.attr("img", "");
      }
      $(event.target).replaceWith(templateIconAddImageEnabled);
    });
    // vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv

    // Remove Poll Option ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Show buttons only if more than 2 options are displayed

    $(".btn-poll-remove").off();
    $(".btn-poll-remove").on("click", event => {
      event.preventDefault();
      if (tPollOptionInput < 3) return;
      else tPollOptionInput--;
      // Grab the row to be deleted
      let selection = $(event.target).closest(".row");
      // Remove button first

      // Checks if total .poll-option-input elements is below the minimum required for .btn-poll-remove elements to be shown
      if (tPollOptionInput < 3) {
        // Removes all .btn-poll-remove elements
        $(".btn-poll-remove")
          .removeClass("scale-in")
          .addClass("scale-out");
        setTimeout(() => $(".btn-poll-remove").remove(), 50);
      } else {
        // Removes only the .btn-poll-remove element clicked on
        $(event.target)
          .closest("a")
          .removeClass("scale-in")
          .addClass("scale-out");
      }
      // Removes the .poll-option element
      selection.slideUp(360, () => {
        selection.remove();
      });
    });
    // vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv

    // Submit Vote ----------------------------------------------------------------------------------
    $("#btn-poll-vote").off();
    $("#btn-poll-vote").on("click", event => {
      event.preventDefault();

      //Grab data (option selected)
      let option = $("input[name=options]:checked", ".poll-radio").val();
      let url = $(".section-poll").attr("url");

      // Check if an option selected was found
      if (option && url) {
        // Ajax Request to server submitting the vote then redirecting to results page
        let data = {
          url: url,
          option: option
        };
        $.ajax({
          url: "/vote",
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify(data),
          success: res => {
            // Response recieved
            let pollBody = $("#poll-body");
            if (pollBody) {
              pollBody.html(res.renderedHtml);
              RefreshDynamicEvents();
            }
          }
        });
      } else {
        toastAlert("Please select an option");
      }
    });

    // Get Results Page ----------------------------------------------------------------------------------
    $("#btn-poll-results").off();
    $("#btn-poll-results").on("click", event => {
      event.preventDefault();

      //Grab url
      let url = $(".section-poll").attr("url");

      // Checks if url was found
      if (url) {
        // Ajax Request to server requesting results page
        let data = {
          url: url
        };
        $.ajax({
          url: "/results",
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify(data),
          success: res => {
            // Response recieved
            let pollBody = $("#poll-body");
            if (pollBody) {
              pollBody.html(res.renderedHtml);
              RefreshDynamicEvents();
            }
          }
        });
      }
    });

    // Get Voting Page ----------------------------------------------------------------------------------
    $("#btn-poll-votepage").off();
    $("#btn-poll-votepage").on("click", event => {
      event.preventDefault();

      //Grab url
      let url = $(".section-poll").attr("url");

      // Checks if url was found
      if (url) {
        // Ajax Request to server requesting results page
        let data = {
          url: url
        };
        $.ajax({
          url: "/votepage",
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify(data),
          success: res => {
            // Response recieved
            let pollBody = $("#poll-body");
            if (pollBody) {
              pollBody.html(res.renderedHtml);
              RefreshDynamicEvents();
            }
          }
        });
      }
    });
  }

  // Static Events
  function InitStaticEvents() {
    // ====================================================================================================
    // > Intervals
    // ====================================================================================================

    // Restarts #icon-settings .rotates animation every 8s
    setInterval(() => {
      let iconSettings = $("#icon-settings");
      iconSettings.removeClass("rotates");
      setTimeout(() => {
        iconSettings.addClass("rotates");
      }, 2000);
    }, 8000);

    // ====================================================================================================
    // > Materializecss Init
    // ====================================================================================================

    // .sidenav - Settings
    (() => {
      let elems = document.querySelectorAll(".sidenav");
      let instances = M.Sidenav.init(elems, { edge: "right" });
    })();

    // ====================================================================================================
    // > #btn-poll-title-input - Click
    // ====================================================================================================

    // Sets focus to #poll-title-input
    $("#btn-poll-title-label").on("click", event => {
      event.preventDefault();
      $("#poll-title-input").focus();
    });

    // ====================================================================================================
    // > #btn-poll-add - Click
    // ====================================================================================================

    // Creates a new .poll-option element and inserts it before the .poll-placeholder element
    $("#btn-poll-add").on("click", event => {
      // Prevents element's default action
      event.preventDefault();

      // Increases count of .poll-option-input
      tPollOptionInput++;

      // Grabs first existing .poll-option as a template
      let templatePollOption = $(".poll-option:first").clone();

      // Removes existing .btn-poll-remove element; Will be added later
      $(templatePollOption)
        .find(".btn-poll-remove")
        .remove();

      // Replaces existing .image-preview element with .icon-add-image (enabled) template
      $(templatePollOption)
        .find(".image-preview")
        .replaceWith(templateIconAddImageEnabled);

      // Hides the .poll-option element initially for animation purposes
      templatePollOption.prop("style", "display: none;");

      // Grabs the .poll-option-input element
      let templatePollOptionInput = templatePollOption.find("input");

      // Resets initial values
      templatePollOptionInput.val("").attr("img", "");

      // Inserts the template before the .poll-placeholder element
      templatePollOption.insertBefore(".poll-placeholder");

      // Sets animation for the inserted template
      templatePollOption.slideToggle(360, () => {
        // Sets focus to the inserted template's .poll-option-input element
        templatePollOptionInput.focus();

        // Checks if tPollOptionInput is 3; Meaning the .poll-option element is the first dynamically added
        if (tPollOptionInput == 3) {
          // Inserts .btn-poll-remove template after all existing .poll-option-input elements
          $(templateBtnPollRemove).insertAfter(".poll-option-input");

          // Sets callback for animation purposes
          setTimeout(() => {
            $(".btn-poll-remove")
              .removeClass("scale-out")
              .addClass("scale-in");
          });
        } else {
          // Inserts .btn-poll-remove template after inserted template's .poll-option-input element
          $(templateBtnPollRemove).insertAfter($(templatePollOptionInput));

          // Sets callback for animation purposes
          setTimeout(() => {
            $(".btn-poll-remove:last")
              .removeClass("scale-out")
              .addClass("scale-in");
          });
        }
        // Refreshes dynamic events due to element changes
        RefreshDynamicEvents();
      });
    });

    // ====================================================================================================
    // > #btn-poll-create - Click
    // ====================================================================================================

    // Validates all input fields; Attempts to make an ajax call to the server
    $("#btn-poll-create").on("click", event => {
      // Prevents element's default action
      event.preventDefault();

      // Initializes variables
      let valid = true;
      let errors = {
        title: false,
        options: false,
        images: false
      };

      // Initializes / Declares object to be filled with grabbed data
      let data = {
        title: undefined,
        options: [],
        settings: {
          images: $("#switch-images").prop("checked") ? true : false,
          uniqueIP: $("#switch-uniqueIP").prop("checked") ? true : false,
          mature: $("#switch-mature").prop("checked") ? true : false
        }
      };

      // Grabs value from #poll-title-input element
      let title = $("#poll-title-input").val();

      // Checks if grabbed value is empty
      if (!title) {
        // Sets errors
        errors.title = true;
        valid = false;
      } else {
        // Inserts grabbed value into data object
        data.title = title;
      }
      // Grab all .poll-option-input elements
      let pollOptionInputElements = $(".poll-option-input").toArray();

      // Loops through grabbed elements
      for (let i = 0; i < pollOptionInputElements.length; i++) {
        let pollOptionInputElement = $(pollOptionInputElements[i]);

        // Grabs value from current element
        let text = pollOptionInputElement.val();

        // Checks if grabbed value is empty
        if (!text) {
          // Sets errors
          if (valid) valid = false;
          errors.options = true;
        }
        // Declares variable to hold img value
        let img;

        // Checks if #switch-images is checked
        if (data.settings.images) {
          // Grabs img attribute from current .poll-option-input element
          img = pollOptionInputElement.attr("img");

          // Checks if grabbed value is empty
          if (!img) {
            // Sets errors
            if (valid) valid = false;
            errors.images = true;
          }
        } else {
          // Sets default value of null
          img = null;
        }

        // Creates an object containing grabbed values
        let option = {
          text: text,
          img: img
        };
        // Inserts created object into data []
        data.options.push(option);
      }

      // Checks validity
      if (!valid) {
        // Creates toast alert for errors set
        if (errors.title) toastAlert("Title is missing");
        if (errors.options) toastAlert("An option is missing");
        if (errors.images) toastAlert("An image is missing");
      } else {
        // Creates ajax request to server
        $.ajax({
          url: "/create",
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify(data),
          success: res => {
            // Replaces #poll-body with html recieved from server
            $("#poll-body").html(res.renderedHtml);

            // Initializes/Refreshes dynamic events
            RefreshDynamicEvents();
          }
        });
      }
    });

    // ====================================================================================================
    // >
    // ====================================================================================================

    // ====================================================================================================
    // >
    // ====================================================================================================

    // </events>
  }

  function initCharts() {
    var ctx = $("#myChart");
    var myChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
        datasets: [
          {
            label: "# of Votes",
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
              "rgba(255, 99, 132, 0.2)",
              "rgba(54, 162, 235, 0.2)",
              "rgba(255, 206, 86, 0.2)",
              "rgba(75, 192, 192, 0.2)",
              "rgba(153, 102, 255, 0.2)",
              "rgba(255, 159, 64, 0.2)"
            ],
            borderColor: [
              "rgba(255,99,132,1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)"
            ],
            borderWidth: 1
          }
        ]
      },
      options: {
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true
              }
            }
          ]
        }
      }
    });
  }
});
