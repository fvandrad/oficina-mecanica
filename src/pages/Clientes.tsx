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
  InputAdornment,
  TableSortLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
}

interface ClienteFormData {
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
}

const clienteVazio: ClienteFormData = {
  nome: '',
  email: '',
  telefone: '',
  endereco: ''
};

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [formData, setFormData] = useState<ClienteFormData>(clienteVazio);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [clienteParaDeletar, setClienteParaDeletar] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [filtro, setFiltro] = useState('');
  const [ordenacao, setOrdenacao] = useState<{
    campo: keyof Cliente | '';
    direcao: 'asc' | 'desc';
  }>({
    campo: '',
    direcao: 'asc'
  });

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/clientes');
      setClientes(response.data);
      setClientesFiltrados(response.data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar clientes',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleOpenForm = (cliente?: Cliente) => {
    if (cliente) {
      setFormData({
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        endereco: cliente.endereco
      });
      setEditingId(cliente.id);
    } else {
      setFormData(clienteVazio);
      setEditingId(null);
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await axios.put(`http://localhost:3001/clientes/${editingId}`, formData);
        setSnackbar({
          open: true,
          message: 'Cliente atualizado com sucesso',
          severity: 'success'
        });
      } else {
        await axios.post('http://localhost:3001/clientes', formData);
        setSnackbar({
          open: true,
          message: 'Cliente adicionado com sucesso',
          severity: 'success'
        });
      }
      handleCloseForm();
      fetchClientes();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao salvar cliente',
        severity: 'error'
      });
    }
  };

  const handleOpenDelete = (id: number) => {
    setClienteParaDeletar(id);
    setOpenDelete(true);
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
  };

  const handleDelete = async () => {
    if (clienteParaDeletar) {
      try {
        await axios.delete(`http://localhost:3001/clientes/${clienteParaDeletar}`);
        setSnackbar({
          open: true,
          message: 'Cliente excluído com sucesso',
          severity: 'success'
        });
        fetchClientes();
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao excluir cliente',
          severity: 'error'
        });
      }
      handleCloseDelete();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleFiltroChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const valorFiltro = event.target.value.toLowerCase();
    setFiltro(valorFiltro);
    
    if (valorFiltro === '') {
      setClientesFiltrados(clientes);
    } else {
      const filtrados = clientes.filter(cliente => 
        cliente.nome.toLowerCase().includes(valorFiltro) ||
        cliente.email.toLowerCase().includes(valorFiltro) ||
        cliente.telefone.toLowerCase().includes(valorFiltro) ||
        cliente.endereco.toLowerCase().includes(valorFiltro)
      );
      setClientesFiltrados(filtrados);
    }
  };

  const handleOrdenacaoChange = (campo: keyof Cliente) => {
    const ehMesmoCampo = ordenacao.campo === campo;
    const novaDirecao = ehMesmoCampo && ordenacao.direcao === 'asc' ? 'desc' : 'asc';
    
    setOrdenacao({
      campo,
      direcao: novaDirecao
    });

    const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
      // Usando o campo diretamente como keyof Cliente, já que sabemos que é válido
      if (a[campo] < b[campo]) {
        return novaDirecao === 'asc' ? -1 : 1;
      }
      if (a[campo] > b[campo]) {
        return novaDirecao === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setClientesFiltrados(clientesOrdenados);
  };

  // Aplicar ordenação quando os dados mudam
  useEffect(() => {
    if (ordenacao.campo !== '') {
      const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
        // Garantir que o campo não seja uma string vazia antes de usá-lo como índice
        const campoOrdenacao = ordenacao.campo as keyof Cliente;
        if (a[campoOrdenacao] < b[campoOrdenacao]) {
          return ordenacao.direcao === 'asc' ? -1 : 1;
        }
        if (a[campoOrdenacao] > b[campoOrdenacao]) {
          return ordenacao.direcao === 'asc' ? 1 : -1;
        }
        return 0;
      });
      setClientesFiltrados(clientesOrdenados);
    }
  }, [clientes]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }} gutterBottom>
          Clientes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          fullWidth={window.innerWidth < 600}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Novo Cliente
        </Button>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar clientes por nome, email, telefone ou endereço"
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
                    active={ordenacao.campo === 'nome'}
                    direction={ordenacao.campo === 'nome' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('nome')}
                  >
                    Nome
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={ordenacao.campo === 'email'}
                    direction={ordenacao.campo === 'email' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('email')}
                  >
                    Email
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={ordenacao.campo === 'telefone'}
                    direction={ordenacao.campo === 'telefone' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('telefone')}
                  >
                    Telefone
                  </TableSortLabel>
                </TableCell>
                <TableCell>Endereço</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientesFiltrados.length > 0 ? (
                clientesFiltrados.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>{cliente.id}</TableCell>
                    <TableCell>{cliente.nome}</TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>{cliente.telefone}</TableCell>
                    <TableCell>{cliente.endereco}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenForm(cliente)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleOpenDelete(cliente.id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Nenhum cliente cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Formulário de Cliente */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="nome"
            label="Nome do Cliente"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.nome}
            onChange={handleInputChange}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="telefone"
            label="Telefone"
            type="tel"
            fullWidth
            variant="outlined"
            value={formData.telefone}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="endereco"
            label="Endereço"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.endereco}
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
            Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
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

export default Clientes;