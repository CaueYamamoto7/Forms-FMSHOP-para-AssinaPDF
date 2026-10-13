document.getElementById('cpf').addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 9) {
    this.value = v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6, 9) + '-' + v.slice(9);
  } else if (v.length > 6) {
    this.value = v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6);
  } else if (v.length > 3) {
    this.value = v.slice(0, 3) + '.' + v.slice(3);
  } else {
    this.value = v;
  }
  clearFieldError('cpf');
});

document.getElementById('telefone').addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 6) {
    this.value = '(' + v.slice(0,2) + ') ' + v.slice(2,7) + '-' + v.slice(7);
  } else if (v.length > 2) {
    this.value = '(' + v.slice(0,2) + ') ' + v.slice(2);
  } else if (v.length > 0) {
    this.value = '(' + v;
  }
  clearFieldError('telefone');
});

['nome', 'email', 'endereco', 'cidade', 'nascimento'].forEach(function (id) {
  document.getElementById(id).addEventListener('input', function () {
    clearFieldError(id);
  });
});

function setFieldError(id, message) {
  const input = document.getElementById(id);
  const err = document.getElementById(id + '-error');
  if (input) input.classList.add('input-error');
  if (err && message) {
    err.textContent = message;
    err.hidden = false;
  }
}

function clearFieldError(id) {
  const input = document.getElementById(id);
  const err = document.getElementById(id + '-error');
  if (input) input.classList.remove('input-error');
  if (err) {
    err.textContent = '';
    err.hidden = true;
  }
  hideFormMessage();
}

function showFormMessage(type, text) {
  const box = document.getElementById('formMessage');
  box.className = 'form-message ' + type;
  box.textContent = text;
  box.hidden = false;
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideFormMessage() {
  const box = document.getElementById('formMessage');
  if (box && box.classList.contains('error')) {
    box.hidden = true;
    box.className = 'form-message';
    box.textContent = '';
  }
}

function setLoading(btn, loading) {
  const label = btn.querySelector('.btn-label');
  const spinner = btn.querySelector('.btn-spinner');
  btn.disabled = loading;
  if (spinner) spinner.hidden = !loading;
  if (label) label.textContent = loading ? 'Enviando...' : 'Concluir cadastro';
}

const API_URL = 'proxy.php';

(function limitBirthdateToToday() {
  const nasc = document.getElementById('nascimento');
  if (nasc) nasc.max = new Date().toISOString().split('T')[0];
})();

document.getElementById('cadastroForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const form = this;
  const btn = document.getElementById('submitBtn');

  const cpfDigits = document.getElementById('cpf').value.replace(/\D/g, '');
  const telDigits = document.getElementById('telefone').value.replace(/\D/g, '');
  let hasError = false;

  if (cpfDigits.length !== 11) {
    setFieldError('cpf', 'CPF incompleto. Digite os 11 números.');
    hasError = true;
  }
  if (telDigits.length < 10) {
    setFieldError('telefone', 'Telefone incompleto. Inclua DDD e número.');
    hasError = true;
  }
  if (!form.checkValidity()) {
    if (!document.getElementById('nome').value.trim()) {
      setFieldError('nome', 'Informe seu nome completo.');
      hasError = true;
    }
    const email = document.getElementById('email');
    if (!email.value.trim() || !email.checkValidity()) {
      setFieldError('email', 'Informe um e-mail válido.');
      hasError = true;
    }
    if (!document.getElementById('endereco').value.trim()) {
      setFieldError('endereco', 'Informe seu endereço.');
      hasError = true;
    }
    if (!document.getElementById('cidade').value.trim()) {
      setFieldError('cidade', 'Informe sua cidade.');
      hasError = true;
    }
    if (!document.getElementById('nascimento').value) {
      setFieldError('nascimento', 'Informe sua data de nascimento.');
      hasError = true;
    }
  }
  if (hasError) {
    const firstError = form.querySelector('.input-error');
    if (firstError) firstError.focus();
    return;
  }

  setLoading(btn, true);

  const dados = {
    nomecliente: document.getElementById('nome').value.trim(),
    cpfcliente: document.getElementById('cpf').value.replace(/\D/g, ''),
    enderecocliente: document.getElementById('endereco').value.trim(),
    cidade: document.getElementById('cidade').value.trim(),
    telefone: document.getElementById('telefone').value.replace(/\D/g, ''),
    email: document.getElementById('email').value.trim(),
    dn: document.getElementById('nascimento').value,
  };

  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(dados)
    });

    const json = await resp.json();

    if (resp.ok && json.status === 'success') {
      showFormMessage('success', 'Cadastro recebido com sucesso! Obrigado por concluir seu cadastro na FMSHOP.');
      form.reset();
    } else {
      showFormMessage('error', (json.message || 'Não foi possível concluir o cadastro. Confira os dados e tente novamente.'));
    }
  } catch (err) {
    showFormMessage('error', 'Erro de conexão. Verifique sua internet e tente novamente.');
    console.error(err);
  } finally {
    setLoading(btn, false);
  }
});
