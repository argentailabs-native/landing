// Utility: safe number
const num = (el) => Number(el?.value || 0);

// DOM
const form = document.getElementById('bmi-form');
const clearBtn = document.getElementById('clear-btn');
const metricFields = document.getElementById('metric-fields');
const imperialFields = document.getElementById('imperial-fields');

const cm = document.getElementById('cm');
const kg = document.getElementById('kg');
const ft = document.getElementById('ft');
const inch = document.getElementById('inch');
const lb = document.getElementById('lb');

const bmiValue = document.getElementById('bmi-value');
const bmiCategory = document.getElementById('bmi-category');

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Units toggle
form.addEventListener('change', (e) => {
  if (e.target.name === 'units') {
    const v = document.querySelector('input[name="units"]:checked').value;
    if (v === 'metric') {
      metricFields.classList.remove('hidden');
      imperialFields.classList.add('hidden');
    } else {
      imperialFields.classList.remove('hidden');
      metricFields.classList.add('hidden');
    }
    show(null);
  }
});

// Compute BMI
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const units = document.querySelector('input[name="units"]:checked').value;
  const result = computeBMI(units);
  show(result);
});

// Clear
clearBtn.addEventListener('click', () => {
  [cm, kg, ft, inch, lb].forEach((el) => el && (el.value = ''));
  show(null);
});

// Live compute (optional)
[cm, kg, ft, inch, lb].forEach((el) => {
  el?.addEventListener('input', () => {
    const units = document.querySelector('input[name="units"]:checked').value;
    const result = computeBMI(units);
    show(result, true);
  });
});

function computeBMI(units){
  let meters = 0;
  let kilograms = 0;

  if (units === 'metric') {
    const c = num(cm);
    const k = num(kg);
    if (c <= 0 || k <= 0) return null;
    meters = c / 100;
    kilograms = k;
  } else {
    const f = num(ft);
    const i = num(inch);
    const pounds = num(lb);
    if ((f <= 0 && i <= 0) || pounds <= 0) return null;
    const totalIn = f * 12 + i;
    meters = totalIn * 0.0254;
    kilograms = pounds * 0.45359237;
  }

  const bmi = kilograms / (meters * meters);
  if (!isFinite(bmi)) return null;

  return {
    bmi: +(bmi.toFixed(1)),
    category: bmiCategoryLabel(bmi),
  };
}

function bmiCategoryLabel(b){
  if (b < 18.5) return 'Underweight';
  if (b < 25)   return 'Normal';
  if (b < 30)   return 'Overweight';
  return 'Obese';
}

function show(result, quiet=false){
  if (!result) {
    bmiValue.textContent = '—';
    bmiCategory.textContent = '—';
    bmiCategory.removeAttribute('data-variant');
    return;
  }
  bmiValue.textContent = result.bmi.toFixed(1);
  bmiCategory.textContent = result.category;
  bmiCategory.setAttribute('data-variant', result.category);
  if (!quiet) {
    flash(bmiValue.parentElement);
    flash(bmiCategory.parentElement);
  }
}

// Small highlight animation
function flash(el){
  el.animate(
    [{ boxShadow:'0 0 0 0 rgba(127,217,255,.0)' },
     { boxShadow:'0 0 0 12px rgba(127,217,255,.18)' },
     { boxShadow:'0 0 0 0 rgba(127,217,255,.0)' }],
    { duration:700, easing:'ease-out' }
  );
}
