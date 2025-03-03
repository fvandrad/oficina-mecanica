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

interface Servico {
  id: number;
  nome: string;
  descricao: string;
  valor: number;
  tempoEstimado: string;
}

interface ServicoFormData {
  nome: string;
  descricao: string;
  valor: number;
  tempoEstimado: string;
}

const servicoVazio: ServicoFormData = {
  nome: '',
  descricao: '',
  valor: 0,
  tempoEstimado: ''
};

const Servicos = () => {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [servicosFiltrados, setServicosFiltrados] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [formData, setFormData] = useState<ServicoFormData>(servicoVazio);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [servicoParaDeletar, setServicoParaDeletar] = useState<number | null>(null);
  const [filtro, setFiltro] = useState('');
  const [ordenacao, setOrdenacao] = useState<{
    campo: keyof Servico | '';
    direcao: 'asc' | 'desc';
  }>({
    campo: '',
    direcao: 'asc'
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  const fetchServicos = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/servicos');
      setServicos(response.data);
      setServicosFiltrados(response.data);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar serviços',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicos();
  }, []);

  const handleOpenForm = (servico?: Servico) => {
    if (servico) {
      setFormData({
        nome: servico.nome,
        descricao: servico.descricao,
        valor: servico.valor,
        tempoEstimado: servico.tempoEstimado
      });
      setEditingId(servico.id);
    } else {
      setFormData(servicoVazio);
      setEditingId(null);
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setFormData(servicoVazio);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'valor' ? Number(value) : value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await axios.put(`http://localhost:3001/servicos/${editingId}`, formData);
        setSnackbar({
          open: true,
          message: 'Serviço atualizado com sucesso',
          severity: 'success'
        });
      } else {
        await axios.post('http://localhost:3001/servicos', formData);
        setSnackbar({
          open: true,
          message: 'Serviço adicionado com sucesso',
          severity: 'success'
        });
      }
      handleCloseForm();
      fetchServicos();
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao salvar serviço',
        severity: 'error'
      });
    }
  };

  const handleOpenDelete = (id: number) => {
    setServicoParaDeletar(id);
    setOpenDelete(true);
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setServicoParaDeletar(null);
  };

  const handleDelete = async () => {
    if (servicoParaDeletar) {
      try {
        await axios.delete(`http://localhost:3001/servicos/${servicoParaDeletar}`);
        setSnackbar({
          open: true,
          message: 'Serviço excluído com sucesso',
          severity: 'success'
        });
        fetchServicos();
      } catch (error) {
        console.error('Erro ao excluir serviço:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao excluir serviço',
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

  const handleFiltroChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const valorFiltro = event.target.value.toLowerCase();
    setFiltro(valorFiltro);
    
    if (valorFiltro === '') {
      setServicosFiltrados(servicos);
    } else {
      const filtrados = servicos.filter(servico => 
        servico.nome.toLowerCase().includes(valorFiltro) ||
        servico.descricao.toLowerCase().includes(valorFiltro) ||
        servico.valor.toString().includes(valorFiltro) ||
        servico.tempoEstimado.toLowerCase().includes(valorFiltro)
      );
      setServicosFiltrados(filtrados);
    }
  };

  const handleOrdenacaoChange = (campo: keyof Servico) => {
    const ehMesmoCampo = ordenacao.campo === campo;
    const novaDirecao = ehMesmoCampo && ordenacao.direcao === 'asc' ? 'desc' : 'asc';
    
    setOrdenacao({
      campo,
      direcao: novaDirecao
    });

    const servicosOrdenados = [...servicosFiltrados].sort((a, b) => {
      if (campo === 'valor') {
        return novaDirecao === 'asc' ? a.valor - b.valor : b.valor - a.valor;
      }

      const aValue = String(a[campo]).toLowerCase();
      const bValue = String(b[campo]).toLowerCase();
      
      return novaDirecao === 'asc' 
        ? aValue.localeCompare(bValue, 'pt-BR')
        : bValue.localeCompare(aValue, 'pt-BR');
    });

    setServicosFiltrados(servicosOrdenados);
  };
  
  // Aplicar ordenação quando os dados mudam
  useEffect(() => {
    if (ordenacao.campo !== '') {
      const servicosOrdenados = [...servicosFiltrados].sort((a, b) => {
        const campoOrdenacao = ordenacao.campo as keyof Servico;
        
        if (campoOrdenacao === 'valor') {
          return ordenacao.direcao === 'asc' ? a.valor - b.valor : b.valor - a.valor;
        }

        const aValue = String(a[campoOrdenacao]).toLowerCase();
        const bValue = String(b[campoOrdenacao]).toLowerCase();
        
        return ordenacao.direcao === 'asc' 
          ? aValue.localeCompare(bValue, 'pt-BR')
          : bValue.localeCompare(aValue, 'pt-BR');
      });
      setServicosFiltrados(servicosOrdenados);
    }
  }, [servicos]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }} gutterBottom>
          Serviços
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          fullWidth={window.innerWidth < 600}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Novo Serviço
        </Button>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar serviços por nome, descrição, valor ou tempo estimado"
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
                    active={ordenacao.campo === 'descricao'}
                    direction={ordenacao.campo === 'descricao' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('descricao')}
                  >
                    Descrição
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={ordenacao.campo === 'valor'}
                    direction={ordenacao.campo === 'valor' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('valor')}
                  >
                    Valor
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={ordenacao.campo === 'tempoEstimado'}
                    direction={ordenacao.campo === 'tempoEstimado' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleOrdenacaoChange('tempoEstimado')}
                  >
                    Tempo Estimado
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {servicosFiltrados.length > 0 ? (
                servicosFiltrados.map((servico) => (
                  <TableRow key={servico.id}>
                    <TableCell>{servico.id}</TableCell>
                    <TableCell>{servico.nome}</TableCell>
                    <TableCell>{servico.descricao}</TableCell>
                    <TableCell>{formatarValor(servico.valor)}</TableCell>
                    <TableCell>{servico.tempoEstimado}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenForm(servico)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleOpenDelete(servico.id)}
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
                    Nenhum serviço cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Formulário de Serviço */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="nome"
            label="Nome do Serviço"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.nome}
            onChange={handleInputChange}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            name="descricao"
            label="Descrição"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.descricao}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="valor"
            label="Valor"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.valor}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="tempoEstimado"
            label="Tempo Estimado"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.tempoEstimado}
            onChange={handleInputChange}
            placeholder="Ex: 2 horas"
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
            Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
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

export default Servicos;