import Slider from './Slider.js';

export default class ScaleSlider extends Slider {
  constructor(args) {
    super(args);

    if (args.value) {
      this._initialValue = args.value;
    } else {
      throw new Error('Cant create scale slider without initial value');
    }

    this._updateInputs();

    //Need to override event handlers that were set in super()
    // this._slider.off('input');
    this._valueInput.off('change');
    this._minInput.off('change');
    this._maxInput.off('change');

    // this._slider.on('input', event => {
    //   this._emit('input');
    //   this.val( this._getValueFromSlider() );
    // });

    this._valueInput.on('change', event => {
      const newValue = this.scaleAsValue( +this._valueInput.val() );
      if (isNaN(newValue)) {
        this._emit('_inputError');
        return;
      }
      this.val(newValue);
    });
    this._minInput.on('change', event => {
      const newValue = this.scaleAsValue( +this._minInput.val() );
      if (isNaN(newValue)) {
        this._emit('_inputError');
        return;
      }
      this.min(newValue);
    });
    this._maxInput.on('change', event => {
    const newValue = this.scaleAsValue( +this._maxInput.val() );
      if (isNaN(newValue)) {
        this._emit('_inputError');
        return;
      }
      this.max(newValue);
    });
  }

  valueAsScale = val => {
    return val / this._initialValue;
  }
  scaleAsValue = scale => {
    return scale * this._initialValue;
  }

  val = newValue => {
    if (newValue !== undefined) {
      //Setter mode
      this._setVal(newValue);
    } else {
      //Getter mode
      return this.valueAsScale(this._value);
    }
  }

  actualVal = () => {
    return this._value;
  }

  min = newValue => {
    if (newValue !== undefined) {
      //Setter mode
      this._setMin(newValue);
    } else {
      //Getter mode
      return this.valueAsScale(this._min);
    }
  }
  max = newValue => {
    if (newValue !== undefined) {
      //Setter mode
      this._setMax(newValue);
    } else {
      //Getter mode
      return this.valueAsScale(this._max);
    }
  }
}
