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

interface Peca {
  id: number;
  nome: string;
  codigo: string;
  marca: string;
  preco: number;
  quantidade: number;
}

interface PecaFormData {
  nome: string;
  codigo: string;
  marca: string;
  preco: number;
  quantidade: number;
}

const pecaVazia: PecaFormData = {
  nome: '',
  codigo: '',
  marca: '',
  preco: 0,
  quantidade: 0
};

const Pecas = () => {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [pecasFiltradas, setPecasFiltradas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [formData, setFormData] = useState<PecaFormData>(pecaVazia);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pecaParaDeletar, setPecaParaDeletar] = useState<number | null>(null);
  const [filtro, setFiltro] = useState('');
  const [ordenacao, setOrdenacao] = useState<{
    campo: keyof Peca | '';
    direcao: 'asc' | 'desc';
  }>({ campo: '', direcao: 'asc' });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  const fetchPecas = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/pecas');
      setPecas(response.data);
      setPecasFiltradas(response.data);
    } catch (error) {
      console.error('Erro ao buscar peças:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar peças',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPecas();
  }, []);

  const handleOpenForm = (peca?: Peca) => {
    if (peca) {
      setFormData({
        nome: peca.nome,
        codigo: peca.codigo,
        marca: peca.marca,
        preco: peca.preco,
        quantidade: peca.quantidade
      });
      setEditingId(peca.id);
    } else {
      setFormData(pecaVazia);
      setEditingId(null);
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setFormData(pecaVazia);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'preco' || name === 'quantidade' ? Number(value) : value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await axios.put(`http://localhost:3001/pecas/${editingId}`, formData);
        setSnackbar({
          open: true,
          message: 'Peça atualizada com sucesso',
          severity: 'success'
        });
      } else {
        await axios.post('http://localhost:3001/pecas', formData);
        setSnackbar({
          open: true,
          message: 'Peça adicionada com sucesso',
          severity: 'success'
        });
      }
      handleCloseForm();
      fetchPecas();
    } catch (error) {
      console.error('Erro ao salvar peça:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao salvar peça',
        severity: 'error'
      });
    }
  };

  const handleOpenDelete = (id: number) => {
    setPecaParaDeletar(id);
    setOpenDelete(true);
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setPecaParaDeletar(null);
  };

  const handleDelete = async () => {
    if (pecaParaDeletar) {
      try {
        await axios.delete(`http://localhost:3001/pecas/${pecaParaDeletar}`);
        setSnackbar({
          open: true,
          message: 'Peça excluída com sucesso',
          severity: 'success'
        });
        fetchPecas();
      } catch (error) {
        console.error('Erro ao excluir peça:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao excluir peça',
          severity: 'error'
        });
      }
      handleCloseDelete();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const formatarPreco = (preco: number) => {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleFiltroChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const valorFiltro = event.target.value.toLowerCase();
    setFiltro(valorFiltro);
    
    if (valorFiltro === '') {
      setPecasFiltradas(pecas);
    } else {
      const filtradas = pecas.filter(peca => 
        peca.nome.toLowerCase().includes(valorFiltro) ||
        peca.codigo.toLowerCase().includes(valorFiltro) ||
        peca.marca.toLowerCase().includes(valorFiltro) ||
        peca.preco.toString().includes(valorFiltro) ||
        peca.quantidade.toString().includes(valorFiltro)
      );
      setPecasFiltradas(filtradas);
    }
  };

  const handleOrdenacaoChange = (campo: keyof Peca) => {
    const ehMesmoCampo = ordenacao.campo === campo;
    const novaDirecao = ehMesmoCampo && ordenacao.direcao === 'asc' ? 'desc' : 'asc';
    
    setOrdenacao({
      campo,
      direcao: novaDirecao
    });

    const pecasOrdenadas = [...pecasFiltradas].sort((a, b) => {
      if (campo === 'preco' || campo === 'quantidade') {
        return novaDirecao === 'asc' ? a[campo] - b[campo] : b[campo] - a[campo];
      }

      const aValue = String(a[campo]).toLowerCase();
      const bValue = String(b[campo]).toLowerCase();
      
      return novaDirecao === 'asc' 
        ? aValue.localeCompare(bValue, 'pt-BR')
        : bValue.localeCompare(aValue, 'pt-BR');
    });

    setPecasFiltradas(pecasOrdenadas);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }} gutterBottom>
          Peças
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          fullWidth={window.innerWidth < 600}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Nova Peça
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar peças por nome, código, marca, preço ou quantidade"
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
                    active={ordenacao.campo === 'codigo'}
                    direction={ordenacao.campo === 'codigo' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('codigo')}
                  >
                    Código
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
                    active={ordenacao.campo === 'preco'}
                    direction={ordenacao.campo === 'preco' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('preco')}
                  >
                    Preço
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={ordenacao.campo === 'quantidade'}
                    direction={ordenacao.campo === 'quantidade' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('quantidade')}
                  >
                    Quantidade
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pecasFiltradas.length > 0 ? (
                pecasFiltradas.map((peca) => (
                  <TableRow key={peca.id}>
                    <TableCell>{peca.id}</TableCell>
                    <TableCell>{peca.nome}</TableCell>
                    <TableCell>{peca.codigo}</TableCell>
                    <TableCell>{peca.marca}</TableCell>
                    <TableCell>{formatarPreco(peca.preco)}</TableCell>
                    <TableCell>{peca.quantidade}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenForm(peca)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleOpenDelete(peca.id)}
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
                    Nenhuma peça cadastrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Formulário de Peça */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Peça' : 'Nova Peça'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="nome"
            label="Nome da Peça"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.nome}
            onChange={handleInputChange}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            name="codigo"
            label="Código"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.codigo}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
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
            name="preco"
            label="Preço"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.preco}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="quantidade"
            label="Quantidade"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.quantidade}
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
            Tem certeza que deseja excluir esta peça? Esta ação não pode ser desfeita.
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
export default Pecas;