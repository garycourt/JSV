$(document).ready(function()
{
  $("#validate_button").click(runValidation);
});

function runValidation() {
  try {
    var JSV = require("./jsv").JSV;
    var schema = eval('('+$("#schema").val()+')');
    var json = eval('('+$("#json_source").val()+')');
    var env = JSV.createEnvironment();
    var report = env.validate(json, schema);

    if (report.errors.length === 0) {
      $("#validation_result").html("valid");
    }
    else {
      var error_messages = "errors: <ol>";
      for (var i = 0 ; i < report.errors.length ; i++) {
        error_messages = error_messages+"<li>"+report.errors[i].message + " " + report.errors[i].uri + "</li>";
      }
      error_messages = error_messages + "</ol>";
      $("#validation_result").html(error_messages);
    }
  }
  catch(err) {
    $("#validation_result").html("Failed to run validator. Are the schema and source valid JSON? try <a href='http://jsonlint.org'>http://jsonlint.org</a> Error message was: "+err);
  }
  return false;
}
