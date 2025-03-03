import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  InputAdornment,
  TableSortLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import 'dayjs/locale/pt-br';
import dayjs, { Dayjs } from 'dayjs';

interface OrdemServico {
  id: string;
  veiculoId: string;
  dataEntrada: string;
  dataSaida: string | null;
  status: string;
  descricao: string;
  servicosIds: string[];
  pecasIds: string[];
  valorTotal: number;
}

interface Veiculo {
  id: string;
  clienteId: string;
  marca: string;
  modelo: string;
  placa: string;
  ano: number;
}

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
}

interface Servico {
  id: string;
  nome: string;
  descricao: string;
  valor: number;
  tempoEstimado: string;
}

interface Peca {
  id: string;
  nome: string;
  codigo: string;
  marca: string;
  preco: number;
  quantidade: number;
}

interface OrdemServicoFormData {
  veiculoId: string;
  dataEntrada: Dayjs;
  dataSaida: Dayjs | null;
  status: string;
  descricao: string;
  servicosIds: string[];
  pecasIds: string[];
  valorTotal: number;
}

const statusOptions = [
  'Aguardando aprovação',
  'Orçamento aprovado',
  'Em andamento',
  'Concluído',
  'Entregue',
  'Cancelado'
];

const ordemVazia: OrdemServicoFormData = {
  veiculoId: '',
  dataEntrada: dayjs(),
  dataSaida: null,
  status: 'Aguardando aprovação',
  descricao: '',
  servicosIds: [],
  pecasIds: [],
  valorTotal: 0
};

const OrdensServico = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [ordensFiltered, setOrdensFiltered] = useState<OrdemServico[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [formData, setFormData] = useState<OrdemServicoFormData>(ordemVazia);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ordemParaDeletar, setOrdemParaDeletar] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [ordenacao, setOrdenacao] = useState<{
    campo: keyof OrdemServico | '';
    direcao: 'asc' | 'desc';
  }>({ campo: '', direcao: 'asc' });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordensRes, veiculosRes, clientesRes, servicosRes, pecasRes] = await Promise.all([
        axios.get('http://localhost:3001/ordens_servico'),
        axios.get('http://localhost:3001/veiculos'),
        axios.get('http://localhost:3001/clientes'),
        axios.get('http://localhost:3001/servicos'),
        axios.get('http://localhost:3001/pecas')
      ]);
      const ordensData = ordensRes.data;
      setOrdens(ordensData);
      setOrdensFiltered(ordensData);
      setVeiculos(veiculosRes.data);
      setClientes(clientesRes.data);
      setServicos(servicosRes.data);
      setPecas(pecasRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar dados',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenForm = (ordem?: OrdemServico) => {
    if (ordem) {
      setFormData({
        veiculoId: ordem.veiculoId,
        dataEntrada: dayjs(ordem.dataEntrada),
        dataSaida: ordem.dataSaida ? dayjs(ordem.dataSaida) : null,
        status: ordem.status,
        descricao: ordem.descricao,
        servicosIds: ordem.servicosIds,
        pecasIds: ordem.pecasIds,
        valorTotal: ordem.valorTotal
      });
      setEditingId(ordem.id);
    } else {
      setFormData(ordemVazia);
      setEditingId(null);
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setFormData(ordemVazia);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date: Dayjs | null, field: 'dataEntrada' | 'dataSaida') => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleMultiSelectChange = (e: any, field: 'servicosIds' | 'pecasIds') => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calcular valor total baseado nos serviços e peças selecionados
  useEffect(() => {
    let total = 0;

    // Somar valor dos serviços
    formData.servicosIds.forEach(servicoId => {
      const servico = servicos.find(s => s.id === servicoId);
      if (servico) {
        total += servico.valor;
      }
    });

    // Somar valor das peças
    formData.pecasIds.forEach(pecaId => {
      const peca = pecas.find(p => p.id === pecaId);
      if (peca) {
        total += peca.preco;
      }
    });

    setFormData(prev => ({
      ...prev,
      valorTotal: total
    }));
  }, [formData.servicosIds, formData.pecasIds, servicos, pecas]);

  const verificarEstoque = (pecasIds: string[]): boolean => {
    for (const pecaId of pecasIds) {
      const peca = pecas.find(p => p.id === pecaId);
      if (peca && peca.quantidade <= 0) {
        setSnackbar({
          open: true,
          message: `Peça ${peca.nome} não possui estoque disponível`,
          severity: 'error'
        });
        return false;
      }
    }
    return true;
  };

  const atualizarEstoque = async (pecasIds: string[]) => {
    for (const pecaId of pecasIds) {
      const peca = pecas.find(p => p.id === pecaId);
      if (peca) {
        await axios.put(`http://localhost:3001/pecas/${pecaId}`, {
          ...peca,
          quantidade: peca.quantidade - 1
        });
      }
    }
  };

  const handleSubmit = async () => {
    try {
      // Verificar estoque disponível
      if (!verificarEstoque(formData.pecasIds)) {
        return;
      }

      const ordemData = {
        ...formData,
        dataEntrada: formData.dataEntrada.toISOString(),
        dataSaida: formData.dataSaida ? formData.dataSaida.toISOString() : null
      };

      if (editingId) {
        // Buscar ordem antiga para comparar peças
        const ordemAntiga = ordens.find(o => o.id === editingId);
        const novasPecas = formData.pecasIds.filter(p => !ordemAntiga?.pecasIds.includes(p));

        await axios.put(`http://localhost:3001/ordens_servico/${editingId}`, ordemData);
        await atualizarEstoque(novasPecas);

        setSnackbar({
          open: true,
          message: 'Ordem de serviço atualizada com sucesso',
          severity: 'success'
        });
      } else {
        await axios.post('http://localhost:3001/ordens_servico', ordemData);
        await atualizarEstoque(formData.pecasIds);

        setSnackbar({
          open: true,
          message: 'Ordem de serviço adicionada com sucesso',
          severity: 'success'
        });
      }
      handleCloseForm();
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar ordem de serviço:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao salvar ordem de serviço',
        severity: 'error'
      });
    }
  };

  const handleOpenDelete = (id: string) => {
    setOrdemParaDeletar(id);
    setOpenDelete(true);
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setOrdemParaDeletar(null);
  };

  const handleDelete = async () => {
    if (ordemParaDeletar) {
      try {
        await axios.delete(`http://localhost:3001/ordens_servico/${ordemParaDeletar}`);
        setSnackbar({
          open: true,
          message: 'Ordem de serviço excluída com sucesso',
          severity: 'success'
        });
        fetchData();
      } catch (error) {
        console.error('Erro ao excluir ordem de serviço:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao excluir ordem de serviço',
          severity: 'error'
        });
      }
      handleCloseDelete();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getVeiculoInfo = (veiculoId: string) => {
    const veiculo = veiculos.find(v => v.id === veiculoId);
    if (!veiculo) return 'Veículo não encontrado';
    return `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})`;
  };

  const getClienteInfo = (veiculoId: string) => {
    const veiculo = veiculos.find(v => v.id === veiculoId);
    if (!veiculo) return 'Cliente não encontrado';

    const cliente = clientes.find(c => c.id === veiculo.clienteId);
    return cliente ? cliente.nome : 'Cliente não encontrado';
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'Aguardando aprovação':
        return 'warning';
      case 'Orçamento aprovado':
        return 'info';
      case 'Em andamento':
        return 'primary';
      case 'Concluído':
        return 'success';
      case 'Entregue':
        return 'success';
      case 'Cancelado':
        return 'error';
      default:
        return 'default';
    }
  };
  const handlePrintOrdem = (ordem: OrdemServico) => {
    // Buscar informações relacionadas
    const veiculo = veiculos.find(v => v.id === ordem.veiculoId);
    const cliente = veiculo ? clientes.find(c => c.id === veiculo.clienteId) : null;

    // Buscar serviços e peças
    const servicosSelecionados = servicos.filter(s => ordem.servicosIds.includes(s.id));
    const pecasSelecionadas = pecas.filter(p => ordem.pecasIds.includes(p.id));

    // Criar conteúdo para impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setSnackbar({
        open: true,
        message: 'Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desativado.',
        severity: 'error'
      });
      return;
    }

    // Estilo para a página de impressão
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ordem de Serviço #${ordem.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #0d47a1;
            padding-bottom: 10px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #0d47a1;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            background-color: #f5f5f5;
            padding: 5px;
          }
          .info-row {
            display: flex;
            margin-bottom: 5px;
          }
          .info-label {
            font-weight: bold;
            width: 150px;
          }
          .info-value {
            flex: 1;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
          }
          .total {
            text-align: right;
            font-weight: bold;
            font-size: 18px;
            margin-top: 20px;
            border-top: 2px solid #0d47a1;
            padding-top: 10px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .signature {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }
          .signature-line {
            width: 200px;
            border-top: 1px solid #333;
            margin-top: 10px;
            text-align: center;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">ORDEM DE SERVIÇO #${ordem.id}</div>
          <div>Oficina Mecânica</div>
        </div>
        
        <div class="section">
          <div class="section-title">Informações do Cliente</div>
          <div class="info-row">
            <div class="info-label">Nome:</div>
            <div class="info-value">${cliente ? cliente.nome : 'Cliente não encontrado'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Telefone:</div>
            <div class="info-value">${cliente ? cliente.telefone : '-'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Email:</div>
            <div class="info-value">${cliente ? cliente.email : '-'}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Informações do Veículo</div>
          <div class="info-row">
            <div class="info-label">Marca/Modelo:</div>
            <div class="info-value">${veiculo ? `${veiculo.marca} ${veiculo.modelo}` : 'Veículo não encontrado'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Placa:</div>
            <div class="info-value">${veiculo ? veiculo.placa : '-'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Ano:</div>
            <div class="info-value">${veiculo ? veiculo.ano : '-'}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Detalhes da Ordem</div>
          <div class="info-row">
            <div class="info-label">Data de Entrada:</div>
            <div class="info-value">${new Date(ordem.dataEntrada).toLocaleDateString('pt-BR')}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Data de Saída:</div>
            <div class="info-value">${ordem.dataSaida ? new Date(ordem.dataSaida).toLocaleDateString('pt-BR') : 'Pendente'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Status:</div>
            <div class="info-value">${ordem.status}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Descrição:</div>
            <div class="info-value">${ordem.descricao || 'Nenhuma descrição fornecida'}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Serviços Realizados</div>
          <table>
            <thead>
              <tr>
                <th>Serviço</th>
                <th>Descrição</th>
                <th>Tempo Estimado</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${servicosSelecionados.length > 0 ?
        servicosSelecionados.map(servico => `
                  <tr>
                    <td>${servico.nome}</td>
                    <td>${servico.descricao}</td>
                    <td>${servico.tempoEstimado}</td>
                    <td>${formatarValor(servico.valor)}</td>
                  </tr>
                `).join('') :
        '<tr><td colspan="4" style="text-align: center">Nenhum serviço registrado</td></tr>'
      }
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <div class="section-title">Peças Utilizadas</div>
          <table>
            <thead>
              <tr>
                <th>Peça</th>
                <th>Código</th>
                <th>Marca</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${pecasSelecionadas.length > 0 ?
        pecasSelecionadas.map(peca => `
                  <tr>
                    <td>${peca.nome}</td>
                    <td>${peca.codigo}</td>
                    <td>${peca.marca}</td>
                    <td>${formatarValor(peca.preco)}</td>
                  </tr>
                `).join('') :
        '<tr><td colspan="4" style="text-align: center">Nenhuma peça utilizada</td></tr>'
      }
            </tbody>
          </table>
        </div>
        
        <div class="total">
          Valor Total: ${formatarValor(ordem.valorTotal)}
        </div>
        
        <div class="signature">
          <div>
            <div class="signature-line">Assinatura do Cliente</div>
          </div>
          <div>
            <div class="signature-line">Assinatura do Responsável</div>
          </div>
        </div>
        
        <div class="footer">
          <p>Oficina Mecânica - Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print();" style="padding: 10px 20px; background-color: #0d47a1; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Imprimir
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Dar tempo para carregar o conteúdo antes de imprimir
    printWindow.onload = function () {
      printWindow.focus();
      // Opcional: imprimir automaticamente
      // printWindow.print();
    };
  };

  const handleFiltroChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const valorFiltro = event.target.value.toLowerCase();
    setFiltro(valorFiltro);
    aplicarFiltros(valorFiltro, filtroStatus);
  };

  const handleFiltroStatusChange = (event: any) => {
    const status = event.target.value;
    setFiltroStatus(status);
    aplicarFiltros(filtro, status);
  };

  const aplicarFiltros = (textoFiltro: string, statusFiltro: string) => {
    let resultado = [...ordens];

    // Aplicar filtro de texto
    if (textoFiltro) {
      resultado = resultado.filter(ordem => {
        const clienteNome = getClienteInfo(ordem.veiculoId).toLowerCase();
        const veiculoInfo = getVeiculoInfo(ordem.veiculoId).toLowerCase();
        const dataFormatada = new Date(ordem.dataEntrada).toLocaleDateString('pt-BR').toLowerCase();
        const valorFormatado = ordem.valorTotal.toString().toLowerCase();

        return clienteNome.includes(textoFiltro) ||
          veiculoInfo.includes(textoFiltro) ||
          dataFormatada.includes(textoFiltro) ||
          valorFormatado.includes(textoFiltro) ||
          ordem.status.toLowerCase().includes(textoFiltro);
      });
    }

    // Aplicar filtro de status
    if (statusFiltro) {
      resultado = resultado.filter(ordem => ordem.status === statusFiltro);
    }

    // Aplicar ordenação se existir
    if (ordenacao.campo !== '') {
      resultado = ordenarOrdens(resultado);
    }

    setOrdensFiltered(resultado);
  };

  const handleOrdenacaoChange = (campo: keyof OrdemServico) => {
    const ehMesmoCampo = ordenacao.campo === campo;
    const novaDirecao = ehMesmoCampo && ordenacao.direcao === 'asc' ? 'desc' : 'asc';

    const novaOrdenacao: {
      campo: keyof OrdemServico | '';
      direcao: 'asc' | 'desc';
    } = {
      campo,
      direcao: novaDirecao
    };

    setOrdenacao(novaOrdenacao);
    setOrdensFiltered(ordenarOrdens(ordensFiltered, campo, novaDirecao));
  };

  const ordenarOrdens = (ordens: OrdemServico[], campo: keyof OrdemServico | '' = ordenacao.campo, direcao: 'asc' | 'desc' = ordenacao.direcao) => {
    if (campo === '' || typeof campo !== 'string') return ordens;

    return [...ordens].sort((a, b) => {
      if (campo === 'valorTotal') {
        return direcao === 'asc' ? a.valorTotal - b.valorTotal : b.valorTotal - a.valorTotal;
      }

      if (campo === 'dataEntrada' || campo === 'dataSaida') {
        const dataA = new Date(a[campo] || '').getTime();
        const dataB = new Date(b[campo] || '').getTime();
        return direcao === 'asc' ? dataA - dataB : dataB - dataA;
      }

      if (campo === 'veiculoId') {
        const veiculoA = getVeiculoInfo(a.veiculoId).toLowerCase();
        const veiculoB = getVeiculoInfo(b.veiculoId).toLowerCase();
        return direcao === 'asc'
          ? veiculoA.localeCompare(veiculoB, 'pt-BR')
          : veiculoB.localeCompare(veiculoA, 'pt-BR');
      }

      const valorA = String(a[campo]).toLowerCase();
      const valorB = String(b[campo]).toLowerCase();

      return direcao === 'asc'
        ? valorA.localeCompare(valorB, 'pt-BR')
        : valorB.localeCompare(valorA, 'pt-BR');
    });
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Ordens de Serviço
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
        >
          Nova Ordem de Serviço
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar ordens por cliente, veículo, data, valor ou status"
              value={filtro}
              onChange={handleFiltroChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="filtro-status-label">Filtrar por Status</InputLabel>
              <Select
                labelId="filtro-status-label"
                value={filtroStatus}
                onChange={handleFiltroStatusChange}
                label="Filtrar por Status"
              >
                <MenuItem value="">Todos os Status</MenuItem>
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={ordenacao.campo === 'veiculoId'}
                    direction={ordenacao.campo === 'veiculoId' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('veiculoId')}
                  >
                    Cliente
                  </TableSortLabel>
                </TableCell>
                <TableCell>Veículo</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={ordenacao.campo === 'dataEntrada'}
                    direction={ordenacao.campo === 'dataEntrada' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('dataEntrada')}
                  >
                    Data de Entrada
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={ordenacao.campo === 'status'}
                    direction={ordenacao.campo === 'status' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={ordenacao.campo === 'valorTotal'}
                    direction={ordenacao.campo === 'valorTotal' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('valorTotal')}
                  >
                    Valor Total
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordensFiltered.length > 0 ? (
                ordensFiltered.map((ordem) => (
                  <TableRow key={ordem.id}>
                    <TableCell>{ordem.id}</TableCell>
                    <TableCell>{getClienteInfo(ordem.veiculoId)}</TableCell>
                    <TableCell>{getVeiculoInfo(ordem.veiculoId)}</TableCell>
                    <TableCell>{new Date(ordem.dataEntrada).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Chip
                        label={ordem.status}
                        color={getStatusChipColor(ordem.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatarValor(ordem.valorTotal)}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenForm(ordem)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => handlePrintOrdem(ordem)}
                        size="small"
                      >
                        <PrintIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleOpenDelete(ordem.id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Nenhuma ordem de serviço cadastrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Formulário de Ordem de Serviço */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="veiculo-label">Veículo</InputLabel>
                <Select
                  labelId="veiculo-label"
                  name="veiculoId"
                  value={formData.veiculoId}
                  onChange={handleSelectChange}
                  label="Veículo"
                >
                  {veiculos.map((veiculo) => (
                    <MenuItem key={veiculo.id} value={veiculo.id}>
                      {veiculo.marca} {veiculo.modelo} - {veiculo.placa} ({getClienteInfo(veiculo.id)})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status}
                  onChange={handleSelectChange}
                  label="Status"
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                <DatePicker
                  label="Data de Entrada"
                  value={formData.dataEntrada}
                  onChange={(date) => handleDateChange(date, 'dataEntrada')}
                  slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                <DatePicker
                  label="Data de Saída"
                  value={formData.dataSaida}
                  onChange={(date) => handleDateChange(date, 'dataSaida')}
                  slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <TextField
                margin="dense"
                name="descricao"
                label="Descrição do Problema/Serviço"
                type="text"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={formData.descricao}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="servicos-label">Serviços</InputLabel>
                <Select
                  labelId="servicos-label"
                  multiple
                  value={formData.servicosIds}
                  onChange={(e) => handleMultiSelectChange(e, 'servicosIds')}
                  label="Serviços"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const servico = servicos.find(s => s.id === value);
                        return (
                          <Chip key={value} label={servico ? servico.nome : value} size="small" />
                        );
                      })}
                    </Box>
                  )}
                >
                  {servicos.map((servico) => (
                    <MenuItem key={servico.id} value={servico.id}>
                      {servico.nome} - {formatarValor(servico.valor)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="pecas-label">Peças</InputLabel>
                <Select
                  labelId="pecas-label"
                  multiple
                  value={formData.pecasIds}
                  onChange={(e) => handleMultiSelectChange(e, 'pecasIds')}
                  label="Peças"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const peca = pecas.find(p => p.id === value);
                        return (
                          <Chip key={value} label={peca ? peca.nome : value} size="small" />
                        );
                      })}
                    </Box>
                  )}
                >
                  {pecas.map((peca) => (
                    <MenuItem key={peca.id} value={peca.id}>
                      {peca.nome} - {formatarValor(peca.preco)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Valor Total: {formatarValor(formData.valorTotal)}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensagens */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrdensServico;