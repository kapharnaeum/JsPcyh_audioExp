/**
 * jspsych-single-audio
 * Josh de Leeuw
 *
 * plugin for playing an audio file and getting a keyboard response
 *+
 * plugin for categorization trials with feedback
 * 
 * documentation: docs.jspsych.org
 *
 **/

jsPsych.plugins["categorization_auditoryStim"] = (function() {

  var plugin = {};

  var context = new AudioContext();

  jsPsych.pluginAPI.registerPreload('categorization_auditoryStim', 'stimulus', 'audio');

  plugin.trial = function(display_element, trial) {

    // default parameters
    trial.choices = trial.choices || [];
    trial.response_ends_trial = (typeof trial.response_ends_trial === 'undefined') ? true : trial.response_ends_trial;
    trial.text_answer = (typeof trial.text_answer === 'undefined') ? "" : trial.text_answer;
    trial.correct_text = (typeof trial.correct_text === 'undefined') ? "<p class='feedback'>Correct</p>" : trial.correct_text;
    trial.incorrect_text = (typeof trial.incorrect_text === 'undefined') ? "<p class='feedback'>Incorrect</p>" : trial.incorrect_text;
    trial.show_feedback_on_timeout = (typeof trial.show_feedback_on_timeout === 'undefined') ? false : trial.show_feedback_on_timeout;
    trial.timeout_message = trial.timeout_message || "<p>Please respond faster.</p>";
    trial.prompt = (typeof trial.prompt === 'undefined') ? "" : trial.prompt;

    // timing parameters
    trial.timing_response = trial.timing_response || -1; // if -1, then wait for response forever
    trial.timing_feedback_duration = trial.timing_feedback_duration || 2000;   
    
    // if any trial variables are functions
    // this evaluates the function and replaces
    // it with the output of the function
    trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

    // this array holds handlers from setTimeout calls
    // that need to be cleared if the trial ends early
    var setTimeoutHandlers = [];

    // play stimulus
    var source = context.createBufferSource();
    source.buffer = jsPsych.pluginAPI.getAudioBuffer(trial.stimulus);
    source.connect(context.destination);
    startTime = context.currentTime + 0.1;
    source.start(startTime);

    // show prompt if there is one
    if (trial.prompt !== "") {
      display_element.append(trial.prompt);
    }

    // store response
    var response = {
      rt: -1,
      key: -1
    };

    // function to end trial when it is time
    var end_trial = function() {

      // kill any remaining setTimeout handlers
      for (var i = 0; i < setTimeoutHandlers.length; i++) {
        clearTimeout(setTimeoutHandlers[i]);
      }

      // stop the audio file if it is playing
      source.stop();

      // kill keyboard listeners
      jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);

      // gather the data to store for the trial
      var trial_data = {
        "rt": response.rt * 1000,
        "correct": correct,
        "stimulus": trial.audio_path,
        "key_press": response.key
      };

      // clear the display
      display_element.html('');

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };

    // function to handle responses by the subject
    var after_response = function(info) {

      // only record the first response
      if (response.key == -1) {
        response = info;
      }

      if (trial.response_ends_trial) {
        end_trial();
      }
    };

    
    // start the response listener
    var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: after_response,
      valid_responses: trial.choices,
      rt_method: 'audio',
      persist: false,
      allow_held_key: false,
      audio_context: context,
      audio_context_start_time: startTime
    });
    // end trial if time limit is set
    if (trial.timing_response > 0) {
      var t2 = setTimeout(function() {
        end_trial();
      }, trial.timing_response);
      setTimeoutHandlers.push(t2);
    }

  };

  return plugin;
})();
