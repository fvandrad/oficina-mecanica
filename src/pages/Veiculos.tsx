import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  TableSortLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

interface Veiculo {
  id: number;
  clienteId: string;
  marca: string;
  modelo: string;
  ano: number;
  placa: string;
}

interface Cliente {
  id: string;
  nome: string;
}

interface VeiculoFormData {
  clienteId: string;
  marca: string;
  modelo: string;
  ano: number;
  placa: string;
}

const veiculoVazio: VeiculoFormData = {
  clienteId: '',
  marca: '',
  modelo: '',
  ano: new Date().getFullYear(),
  placa: ''
};

const Veiculos = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [formData, setFormData] = useState<VeiculoFormData>(veiculoVazio);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [veiculoParaDeletar, setVeiculoParaDeletar] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [veiculosRes, clientesRes] = await Promise.all([
        axios.get('http://localhost:3001/veiculos'),
        axios.get('http://localhost:3001/clientes')
      ]);
      setVeiculos(veiculosRes.data);
      setClientes(clientesRes.data);
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

  const handleOpenForm = (veiculo?: Veiculo) => {
    if (veiculo) {
      setFormData({
        clienteId: veiculo.clienteId,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        ano: veiculo.ano,
        placa: veiculo.placa
      });
      setEditingId(veiculo.id);
    } else {
      setFormData(veiculoVazio);
      setEditingId(null);
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setFormData(veiculoVazio);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ano' ? Number(value) : value
    }));
  };

  const handleSelectChange = (e: any) => {
    setFormData(prev => ({
      ...prev,
      clienteId: e.target.value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await axios.put(`http://localhost:3001/veiculos/${editingId}`, formData);
        setSnackbar({
          open: true,
          message: 'Veículo atualizado com sucesso',
          severity: 'success'
        });
      } else {
        await axios.post('http://localhost:3001/veiculos', formData);
        setSnackbar({
          open: true,
          message: 'Veículo adicionado com sucesso',
          severity: 'success'
        });
      }
      handleCloseForm();
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar veículo:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao salvar veículo',
        severity: 'error'
      });
    }
  };

  const handleOpenDelete = (id: number) => {
    setVeiculoParaDeletar(id);
    setOpenDelete(true);
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setVeiculoParaDeletar(null);
  };

  const handleDelete = async () => {
    if (veiculoParaDeletar) {
      try {
        await axios.delete(`http://localhost:3001/veiculos/${veiculoParaDeletar}`);
        setSnackbar({
          open: true,
          message: 'Veículo excluído com sucesso',
          severity: 'success'
        });
        fetchData();
      } catch (error) {
        console.error('Erro ao excluir veículo:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao excluir veículo',
          severity: 'error'
        });
      }
      handleCloseDelete();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getClienteNome = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nome : 'Cliente não encontrado';
  };

  const [veiculosFiltrados, setVeiculosFiltrados] = useState<Veiculo[]>([]);
  const [filtro, setFiltro] = useState('');
  const [ordenacao, setOrdenacao] = useState<{
    campo: keyof Veiculo | '';
    direcao: 'asc' | 'desc';
  }>({ campo: '', direcao: 'asc' });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (veiculos.length > 0) {
      setVeiculosFiltrados(veiculos);
    }
  }, [veiculos]);

  const handleFiltroChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const valorFiltro = event.target.value.toLowerCase();
    setFiltro(valorFiltro);
    
    if (valorFiltro === '') {
      setVeiculosFiltrados(veiculos);
    } else {
      const filtrados = veiculos.filter(veiculo => {
        const clienteNome = getClienteNome(veiculo.clienteId).toLowerCase();
        return (
          veiculo.marca.toLowerCase().includes(valorFiltro) ||
          veiculo.modelo.toLowerCase().includes(valorFiltro) ||
          veiculo.placa.toLowerCase().includes(valorFiltro) ||
          clienteNome.includes(valorFiltro) ||
          veiculo.ano.toString().includes(valorFiltro)
        );
      });
      setVeiculosFiltrados(filtrados);
    }
  };

  const handleOrdenacaoChange = (campo: keyof Veiculo) => {
    const ehMesmoCampo = ordenacao.campo === campo;
    const novaDirecao = ehMesmoCampo && ordenacao.direcao === 'asc' ? 'desc' : 'asc';
    
    setOrdenacao({
      campo,
      direcao: novaDirecao
    });

    const veiculosOrdenados = [...veiculosFiltrados].sort((a, b) => {
      if (campo === 'clienteId') {
        const nomeClienteA = getClienteNome(a.clienteId).toLowerCase();
        const nomeClienteB = getClienteNome(b.clienteId).toLowerCase();
        return novaDirecao === 'asc' 
          ? nomeClienteA.localeCompare(nomeClienteB)
          : nomeClienteB.localeCompare(nomeClienteA);
      }

      const aValue = a[campo];
      const bValue = b[campo];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return novaDirecao === 'asc'
          ? aValue.localeCompare(bValue, 'pt-BR')
          : bValue.localeCompare(aValue, 'pt-BR');
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return novaDirecao === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    setVeiculosFiltrados(veiculosOrdenados);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }} gutterBottom>
          Veículos
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          fullWidth={window.innerWidth < 600}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Novo Veículo
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar veículos por marca, modelo, placa, ano ou cliente"
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
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={ordenacao.campo === 'clienteId'}
                    direction={ordenacao.campo === 'clienteId' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('clienteId')}
                  >
                    Cliente
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={ordenacao.campo === 'marca'}
                    direction={ordenacao.campo === 'marca' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('marca')}
                  >
                    Marca
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={ordenacao.campo === 'modelo'}
                    direction={ordenacao.campo === 'modelo' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('modelo')}
                  >
                    Modelo
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={ordenacao.campo === 'ano'}
                    direction={ordenacao.campo === 'ano' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('ano')}
                  >
                    Ano
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={ordenacao.campo === 'placa'}
                    direction={ordenacao.campo === 'placa' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('placa')}
                  >
                    Placa
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {veiculosFiltrados.length > 0 ? (
                veiculosFiltrados.map((veiculo) => (
                  <TableRow key={veiculo.id}>
                    <TableCell>{veiculo.id}</TableCell>
                    <TableCell>{getClienteNome(veiculo.clienteId)}</TableCell>
                    <TableCell>{veiculo.marca}</TableCell>
                    <TableCell>{veiculo.modelo}</TableCell>
                    <TableCell>{veiculo.ano}</TableCell>
                    <TableCell>{veiculo.placa}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenForm(veiculo)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleOpenDelete(veiculo.id)}
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
                    Nenhum veículo cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Formulário de Veículo */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense" sx={{ mb: 2, mt: 1 }}>
            <InputLabel id="cliente-label">Cliente</InputLabel>
            <Select
              labelId="cliente-label"
              value={formData.clienteId}
              onChange={handleSelectChange}
              label="Cliente"
            >
              {clientes.map((cliente) => (
                <MenuItem key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="marca"
            label="Marca"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.marca}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="modelo"
            label="Modelo"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.modelo}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="ano"
            label="Ano"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.ano}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="placa"
            label="Placa"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.placa}
            onChange={handleInputChange}
          />
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
            Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
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

export default Veiculos;