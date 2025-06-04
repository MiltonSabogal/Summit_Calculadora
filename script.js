let seleccionados = [];

// Menú móvil
document.getElementById('mobileMenuBtn').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
    this.querySelector('i').classList.toggle('fa-bars');
    this.querySelector('i').classList.toggle('fa-times');
});

// Event listener para búsqueda (agregado)
document.getElementById("busqueda").addEventListener("input", filtrarProductos);

function filtrarProductos() {
    const query = document.getElementById("busqueda").value.toLowerCase();
    const contenedor = document.getElementById("sugerencias");
    contenedor.innerHTML = "";
    
    if (query.length < 2) {
        contenedor.style.display = "none";
        return;
    }

    const resultados = productos
        .filter(p => 
            p.nombre.toLowerCase().includes(query) || 
            p.codigo.toLowerCase().includes(query)
        )
        .slice(0, 10);

    if (resultados.length > 0) {
        contenedor.style.display = "block";
        resultados.forEach(p => {
            const item = document.createElement("div");
            item.className = "suggestion-item";
            item.innerHTML = `
                <div class="suggestion-image">
                    <i class="fas fa-box"></i>
                </div>
                <div class="suggestion-info">
                    <div class="suggestion-name">${p.nombre}</div>
                    <div class="suggestion-code">Código: ${p.codigo}</div>
                    <div class="suggestion-price">$${p.precio.toLocaleString('es-CO')} COP</div>
                </div>
            `;
            item.onclick = () => {
                agregarProducto(p);
                contenedor.style.display = "none";
                document.getElementById("busqueda").value = "";
            };
            contenedor.appendChild(item);
        });
    } else {
        contenedor.style.display = "none";
    }
}

function agregarProducto(producto) {
    const existeIndex = seleccionados.findIndex(p => p.codigo === producto.codigo);
    
    if (existeIndex !== -1) {
        seleccionados[existeIndex].cantidad++;
    } else {
        producto.cantidad = 1;
        seleccionados.push(producto);
    }
    
    actualizarSeleccionados();
    calcular();
}

function limpiarSeleccionados() {
    seleccionados = [];
    actualizarSeleccionados();
    calcular();
}

function eliminarProducto(index) {
    seleccionados.splice(index, 1);
    actualizarSeleccionados();
    calcular();
}

function actualizarCantidad(index, cantidad) {
    if (cantidad < 1) cantidad = 1;
    seleccionados[index].cantidad = cantidad;
    actualizarSeleccionados();
    calcular();
}

function actualizarSeleccionados() {
    const ul = document.getElementById("seleccionados");
    ul.innerHTML = "";
    
    let totalSeleccionado = 0;
    
    seleccionados.forEach((p, index) => {
        const precioTotal = p.precio * p.cantidad;
        totalSeleccionado += precioTotal;
        
        const li = document.createElement("li");
        li.className = "selected-item";
        li.innerHTML = `
            <div class="selected-image">
                <i class="fas fa-box"></i>
            </div>
            <div class="selected-info">
                <div class="selected-name">${p.nombre}</div>
                <div class="selected-price">$${p.precio.toLocaleString('es-CO')} COP × ${p.cantidad} = $${precioTotal.toLocaleString('es-CO')} COP</div>
                <div class="selected-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="actualizarCantidad(${index}, ${p.cantidad - 1})">-</button>
                        <input type="number" class="quantity-input" value="${p.cantidad}" min="1" onchange="actualizarCantidad(${index}, parseInt(this.value))">
                        <button class="quantity-btn" onclick="actualizarCantidad(${index}, ${p.cantidad + 1})">+</button>
                    </div>
                    <button class="remove-button" onclick="eliminarProducto(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        ul.appendChild(li);
    });
    
    document.getElementById("total-seleccionado").textContent = totalSeleccionado.toLocaleString('es-CO');
}

function calcular() {
    let subtotal = seleccionados.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
    let precioTotal = subtotal;
    let precioSinIVA = precioTotal / 1.19;
    let iva = precioTotal - precioSinIVA;
    let deposito = parseFloat(document.getElementById("deposito").value || 0);
    let saldoFinanciar = Math.max(0, precioTotal - deposito);
    let tasaMV = parseFloat(document.getElementById("tasa_mv").value || 1.90) / 100;
    let cuotasInput = parseInt(document.getElementById("cuotas").value || 18);

    let cuotas = Math.min(cuotasInput, 24);
            if (cuotasInput > 24) {
                alert("El número máximo de cuotas es 24.");
                document.getElementById("cuotas").value = "24";
            }
            

    let pagoMensual = 0;

    // Cálculo corregido de cuotas
    if (cuotas > 0) {
        if (cuotas <= 6) {
            pagoMensual = saldoFinanciar / cuotas;
        } else {
            const i = tasaMV;
            // Fórmula corregida para cálculo financiero
            pagoMensual = saldoFinanciar * (i * Math.pow(1 + i, cuotas)) / (Math.pow(1 + i, cuotas) - 1);
        }
    }

    // Actualizar UI
    document.getElementById("precio-sin-iva").textContent = `$${Math.round(precioSinIVA).toLocaleString('es-CO')}`;
    document.getElementById("iva").textContent = `$${Math.round(iva).toLocaleString('es-CO')}`;
    document.getElementById("precio-total").textContent = `$${Math.round(precioTotal).toLocaleString('es-CO')}`;
    document.getElementById("saldo-financiar").textContent = `$${Math.round(saldoFinanciar).toLocaleString('es-CO')}`;
    document.getElementById("pago-mensual").textContent = `$${Math.round(pagoMensual).toLocaleString('es-CO')}`;

    actualizarGrafico(cuotas, pagoMensual, saldoFinanciar);
}

function actualizarGrafico(cuotas, pagoMensual, saldoFinanciar) {
    const chart = document.getElementById("payment-chart");
    chart.innerHTML = "";
    
    const valores = [];
    for (let i = 1; i <= Math.min(cuotas, 6); i++) {
        valores.push({
            mes: `Mes ${i}`,
            valor: i === cuotas ? saldoFinanciar - (pagoMensual * (cuotas - 1)) : pagoMensual
        });
    }
    
    const maxValor = Math.max(...valores.map(v => v.valor), saldoFinanciar);
    
    valores.forEach(v => {
        const barHeight = (v.valor / maxValor) * 150;
        const bar = document.createElement("div");
        bar.className = "chart-bar";
        bar.style.height = `${barHeight}px`;
        bar.innerHTML = `
        <div class="chart-bar-value">$${Math.round(v.valor).toLocaleString('es-CO', {maximumFractionDigits: 0})}</div>
        <div class="chart-bar-label">${v.mes}</div>
    `;
        chart.appendChild(bar);
    });
}

function resetearCalculadora() {
    seleccionados = [];
    document.getElementById("deposito").value = "0";
    document.getElementById("tasa_ea").value = "25.34";
    document.getElementById("tasa_mv").value = "1.90";
    document.getElementById("cuotas").value = "18";
    actualizarSeleccionados();
    calcular();
}

window.onload = function() {
    actualizarSeleccionados();
    calcular();
};
