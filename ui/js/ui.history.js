var UI = (function(UI, $, undefined) {
  UI.handleHistory = function() {
    var modal;

    $("#history-stack").on("click", ".show-bundle", function(e) {
      e.preventDefault();

      var hash = $(this).closest("li").data("hash");
      var $modal = $("#bundle-modal");

      var persistence = $(this).closest("li").data("persistence");
      var options = {hashTracking: false, closeOnOutsideClick: false, closeOnEscape: false};

      console.log("UI.handleHistory: Show bundle modal for hash " + hash);

      iota.api.getBundle(hash, function(error, transactions) {
        if (error) { 
          return;
        }
        var html = "<div class='list'><ul>";

        for (var i=0; i<transactions.length; i++) {
          html += "<li><div class='details'><div class='address'>" + UI.formatForClipboard(iota.utils.addChecksum(transactions[i].address)) + "</div></div><div class='value'>" + UI.formatAmount(transactions[i].value) + "</div></li>";
        }

        html += "</ul></div>";
      
        $modal.find(".contents").html(html);
        $modal.find(".hash").html("<strong>Hash:</strong> " + UI.formatForClipboard(hash));

        /*
        if (bundle.transactions[0].signatureMessageChunk != "999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999") {
          $modal.find(".message").html("<strong>Message:</strong> " + String(bundle.transactions[0].signatureMessageChunk.replace(/[9]+$/, "")).escapeHTML()).show();
        } else {
          $modal.find(".message").html("").hide();
        }*/

        $modal.find(".persistence").html("Persistence: " + (persistence ? "Confirmed" : "Pending")).show(); 
        $modal.find(".btn").data("hash", hash);

        $modal.find(".btn").each(function() {
          $(this).loadingReset($(this).data("initial"));
        });

        if (!persistence) {
          $modal.find(".btn").show();
        } else {
          $modal.find(".btn").hide();
        }
        
        modal = $modal.remodal(options);
        modal.open();
      });
    });

    $("#replay-btn, #rebroadcast-btn").on("click", function(e) {
      e.preventDefault();

      var hash = $(this).data("hash");

      if (!hash) {
        console.log("UI.replay/rebroadcast: No hash");
        return;
      }

      var isRebroadcast = $(this).attr("id") == "rebroadcast-btn";

      if (isRebroadcast) {
        $("#replay-btn").attr("disabled", "disabled");
      } else {
        $("#rebroadcast-btn").attr("disabled", "disabled");
      }

      $(".remodal-close").on("click", function(e) {
        UI.notify("error", "Cannot close whilst " + (isRebroadcast ? "rebroadcasting" : "replaying") + ".");
        e.preventDefault();
        e.stopPropagation();
      });

      console.log("UI.handleHistory: Do " + (isRebroadcast ? "rebroadcast" : "replay") + " for hash " + hash);

      UI.isLocked = true;

      if (isRebroadcast) {
        iota.api.broadcastBundle(hash, function(error, bundle) {
          if (error) {
            console.log("UI.rebroadcast: Error");
            console.log(error);
            $("#rebroadcast-btn").loadingError(error);
          } else {
            console.log("UI.rebroadcast: Success");
            if (!UI.isFocused()) {
              UI.notifyDesktop("Transaction rebroadcasted successfully");
            }
            $("#rebroadcast-btn").loadingSuccess("Rebroadcast Completed");
            UI.updateState(1000);
          }

          UI.isLocked = false;
          $(".remodal-close").off("click");
          $("#replay-btn").removeAttr("disabled");
        });
      } else {
        iota.api.replayBundle(hash, connection.depth, connection.minWeightMagnitude, function(error, bundle) {
          console.log(bundle);
          if (error) {
            console.log("UI.replay: Error");
            console.log(error);
            $("#replay-btn").loadingError(error);
          } else {
            console.log("UI.replay: Success");
            if (!UI.isFocused()) {
              UI.notifyDesktop("Transaction replayed successfully");
            }
            $("#replay-btn").loadingSuccess("Replay Completed");
            $("#bundle-modal .persistence").hide();

            UI.updateState(1000);
          }

          UI.isLocked = false;
          $(".remodal-close").off("click");
          $("#rebroadcast-btn").removeAttr("disabled");
        });
      }
    });

    $("#history-stack .submenu li").on("click", function(e) {
      e.preventDefault();

      $("#history-stack .active").removeClass("active");
      $(this).addClass("active");

      var type = $(this).data("type");
      if (type == "transfers") {
        $("#history-stack .addresses").hide();
        $("#history-stack .transfers").show();
      } else {
        $("#history-stack .transfers").hide();
        $("#history-stack .addresses").show();
      }
      UI.animateStacks(200);
    });
  }

  UI.updateHistory = function() {
    //no changes..
    if (JSON.stringify(connection.accountData) == JSON.stringify(connection.previousAccountData)) {
      return;
    }

    var $transfersBtn = $("#history-stack li[data-type=transfers]");
    var $addressesBtn = $("#history-stack li[data-type=addresses]");

    var $transfers = $("#history-stack .transfers");
    var $addresses = $("#history-stack .addresses");

    var transfersHtml = addressesHtml = "";

    if (connection.accountData) {
      var addresses = iota.utils.addChecksum(connection.accountData.addresses).reverse();

      $.each(addresses, function(i, address) {
        addressesHtml += "<li>";
        addressesHtml += "<div class='details'>";
        addressesHtml += "<div class='address'>" + UI.formatForClipboard(address) + "</div>";
        addressesHtml += "</div>";
        addressesHtml += "<div class='value'></div>";
        addressesHtml += "</div>";
        addressesHtml += "</li>";
      });

      var categorizedTransfers = iota.utils.categorizeTransfers(connection.accountData.transfers, connection.accountData.addresses);

      $.each(connection.accountData.transfers.reverse(), function(i, bundle) {
        var persistence = bundle[0].persistence ? bundle[0].persistence : false;
        var isSent = false;
        $.each(categorizedTransfers.sent, function(i, sentBundle) {
          if (sentBundle[0].hash == bundle[0].hash) {
            isSent = true;
            return false;
          }
        });

        transfersHtml += "<li data-hash='" + String(bundle[0].hash).escapeHTML() + "' data-type='" + (isSent ? "spending" : "receiving") + "' data-persistence='" + persistence*1 + "'>";
        transfersHtml += "<div class='type'><i class='fa fa-arrow-circle-" + (isSent ? "left" : "right") + "'></i></div>";
        transfersHtml += "<div class='details'>";
        transfersHtml += "<div class='date'>" + (bundle[0].timestamp != "0" ? UI.formatDate(bundle[0].timestamp, true) : "Genesis") + "</div>";
        transfersHtml += "<div class='address'>" + (bundle[0].address ? UI.formatForClipboard(iota.utils.addChecksum(bundle[0].address)) : "/") + "</div>";
        transfersHtml += "<div class='action'>" + (bundle[0].hash ? "<a href='#' class='show-bundle'>Show bundle</a> " : "") + "<span>" + (persistence ? "Confirmed" : "Pending") + "</span></div>";
        transfersHtml += "</div>";
        transfersHtml += "<div class='value'>" + UI.formatAmount(bundle[0].value) + "</div>";
        transfersHtml += "</li>";
      });
    }

    $transfersBtn.html("<span>" + connection.accountData.transfers.length + " </span>Transfer" + (connection.accountData.transfers.length != "1" ? "s" : ""));
    $addressesBtn.html("<span>" + connection.accountData.addresses.length + " </span>Address" + (connection.accountData.addresses.length != "1" ? "es" : ""));

    if (!transfersHtml) {
      $transfers.find("ul").empty().hide();
      $transfers.find("p").show();
    } else {
      $transfers.find("ul").html(transfersHtml).show();
      $transfers.find("p").hide();
    }

    if (!addressesHtml) {
      $addressesBtn.html("0 Addresses");
      $addresses.find("ul").empty().hide();
      $addresses.find("p").show();
    } else {
      $addresses.find("ul").html(addressesHtml).show();
      $addresses.find("p").hide();
    }

    if ($("#history-stack").hasClass("open")) {
      UI.animateStacks(200);
    }
  }

  UI.updateBalance = function() {
    $("#available-balance, #available-balance-always").html(UI.formatAmount(connection.accountData.balance));
  }

  return UI;
}(UI || {}, jQuery));