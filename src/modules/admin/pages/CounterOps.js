import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Button, Tabs, Tab, Chip, Alert, CircularProgress, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Avatar,
} from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { PageHeader, StatsRow } from '../../../components/page/PagePrimitives';
import { listCounterSales } from '../../../api/counterSales';
import { listStockAdjustments, reviewStockAdjustment } from '../../../api/stockAdjustments';
import { listSuppliers, reviewSupplier } from '../../../api/suppliers';

const ACCENT = '#1d4ed8';

const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

const STATUS_META = {
  pending: { color: '#b45309', bg: '#fef3c7', label: 'Pending', Icon: HourglassEmptyIcon },
  approved: { color: '#15803d', bg: '#dcfce7', label: 'Approved', Icon: CheckCircleOutlinedIcon },
  rejected: { color: '#b91c1c', bg: '#fee2e2', label: 'Rejected', Icon: CancelOutlinedIcon },
};

export default function CounterOps() {
  const [tab, setTab] = useState(0);
  const [sales, setSales] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [reviewModal, setReviewModal] = useState(null); // {kind:'adj'|'sup', target, action}

  const reload = async () => {
    setLoading(true); setError('');
    try {
      const [s, a, sp] = await Promise.all([
        listCounterSales(),
        listStockAdjustments(),
        listSuppliers(),
      ]);
      setSales(s); setAdjustments(a); setSuppliers(sp);
    } catch (e) { setError(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const pendingAdj = useMemo(() => adjustments.filter((a) => a.status === 'pending'), [adjustments]);
  const pendingSup = useMemo(() => suppliers.filter((s) => s.approvalStatus === 'pending'), [suppliers]);

  const todayUnits = useMemo(() => {
    const today = new Date().toDateString();
    return sales
      .filter((s) => new Date(s.soldAt).toDateString() === today)
      .reduce((sum, s) => sum + (s.totalUnits || 0), 0);
  }, [sales]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Counter Operations"
        subtitle="Live counter sales, stock adjustment approvals, and supplier requests."
      />

      <StatsRow
        cols={4}
        items={[
          { label: 'Total Sales', value: sales.length },
          { label: 'Units Today', value: todayUnits, valueColor: '#15803d' },
          { label: 'Pending Adjustments', value: pendingAdj.length, valueColor: '#b45309' },
          { label: 'Pending Suppliers', value: pendingSup.length, valueColor: '#b45309' },
        ]}
      />

      <Box sx={{ mb: 2, borderBottom: '1px solid #e5e7eb' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { color: ACCENT },
            '& .MuiTabs-indicator': { bgcolor: ACCENT },
          }}
        >
          <Tab label={`Counter Sales (${sales.length})`} />
          <Tab label={`Stock Adjustments (${pendingAdj.length})`} />
          <Tab label={`Supplier Requests (${pendingSup.length})`} />
        </Tabs>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={28} /></Stack>
      ) : (
        <>
          {tab === 0 && <SalesList sales={sales} />}
          {tab === 1 && (
            <AdjustmentsList
              adjustments={adjustments}
              onReview={(target, action) => setReviewModal({ kind: 'adj', target, action })}
            />
          )}
          {tab === 2 && (
            <SuppliersList
              suppliers={suppliers}
              onReview={(target, action) => setReviewModal({ kind: 'sup', target, action })}
            />
          )}
        </>
      )}

      {reviewModal && (
        <ReviewDialog
          state={reviewModal}
          onClose={() => setReviewModal(null)}
          onDone={(msg) => { setToast(msg); setReviewModal(null); reload(); }}
        />
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={2400} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}

function SalesList({ sales }) {
  if (sales.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', border: '1px dashed #e5e7eb', borderRadius: 2 }}>
        <Typography sx={{ color: '#6b7280' }}>No counter sales yet.</Typography>
      </Box>
    );
  }
  return (
    <Stack spacing={1.2}>
      {sales.map((s) => (
        <Box key={s.id} sx={{ p: 2, bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
            <Avatar sx={{ width: 38, height: 38, bgcolor: '#dbeafe', color: '#1d4ed8' }}>
              <StorefrontOutlinedIcon />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>{s.customer?.name || '—'}</Typography>
              <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                {s.customer?.phone || ''}{s.customer?.phone && s.customer?.address ? ' · ' : ''}{s.customer?.address || ''}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{fmt(s.soldAt)}</Typography>
            <Chip size="small" label={`${s.totalUnits}u`} sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }} />
          </Stack>
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', pl: 6.5 }}>
            {(s.items || []).map((it, i) => (
              <Chip key={i} size="small" label={`${it.name} × ${it.qty}`} sx={{ bgcolor: '#f3f4f6', fontSize: 11.5 }} />
            ))}
          </Stack>
          {s.recordedByName && (
            <Typography sx={{ fontSize: 11.5, color: '#6b7280', pl: 6.5, mt: 0.6 }}>
              By: {s.recordedByName}
            </Typography>
          )}
        </Box>
      ))}
    </Stack>
  );
}

function AdjustmentsList({ adjustments, onReview }) {
  if (adjustments.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', border: '1px dashed #e5e7eb', borderRadius: 2 }}>
        <Typography sx={{ color: '#6b7280' }}>No stock adjustment requests.</Typography>
      </Box>
    );
  }
  return (
    <Stack spacing={1.2}>
      {adjustments.map((a) => {
        const meta = STATUS_META[a.status] || STATUS_META.pending;
        const Icon = meta.Icon;
        return (
          <Box key={a.id} sx={{ p: 2, bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5 }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
              <Chip size="small" icon={<Icon sx={{ fontSize: 16 }} />} label={meta.label}
                sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{a.reason || '—'}</Typography>
              <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{fmt(a.requestedAt || a.createdAt)}</Typography>
            </Stack>
            <Typography sx={{ fontSize: 12, color: '#6b7280', mb: 1 }}>
              Requested by: <strong>{a.requestedByName || '—'}</strong>
            </Typography>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mb: 1 }}>
              {(a.items || []).map((it, i) => (
                <Chip key={i} size="small"
                  label={`${it.type === 'add' ? '+' : '−'} ${it.name} × ${it.qty}`}
                  sx={{
                    bgcolor: it.type === 'add' ? '#dbeafe' : '#fee2e2',
                    color: it.type === 'add' ? '#1d4ed8' : '#b91c1c',
                    fontSize: 11.5, fontWeight: 600,
                  }}
                />
              ))}
            </Stack>
            {a.status === 'pending' && (
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button size="small" variant="contained" color="success"
                  onClick={() => onReview(a, 'approve')} sx={{ textTransform: 'none' }}>Approve</Button>
                <Button size="small" variant="outlined" color="error"
                  onClick={() => onReview(a, 'reject')} sx={{ textTransform: 'none' }}>Reject</Button>
              </Stack>
            )}
            {a.reviewNote && (
              <Typography sx={{ fontSize: 11.5, color: '#6b7280', mt: 0.8, fontStyle: 'italic' }}>
                Note: {a.reviewNote}
              </Typography>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}

function SuppliersList({ suppliers, onReview }) {
  if (suppliers.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', border: '1px dashed #e5e7eb', borderRadius: 2 }}>
        <Typography sx={{ color: '#6b7280' }}>No supplier requests.</Typography>
      </Box>
    );
  }
  return (
    <Stack spacing={1.2}>
      {suppliers.map((s) => {
        const meta = STATUS_META[s.approvalStatus] || STATUS_META.pending;
        const Icon = meta.Icon;
        return (
          <Box key={s.id} sx={{ p: 2, bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5 }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
              <Avatar sx={{ width: 38, height: 38, bgcolor: '#f3e8ff', color: '#7c3aed' }}>
                <StorefrontOutlinedIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>{s.name}</Typography>
                  <Chip size="small" icon={<Icon sx={{ fontSize: 14 }} />} label={meta.label}
                    sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, height: 22 }} />
                </Stack>
                <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                  {[s.contactPerson, s.phone, s.city].filter(Boolean).join(' · ')}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: '#6b7280' }}>By: {s.requestedByName || '—'}</Typography>
            </Stack>
            {s.approvalStatus === 'pending' && (
              <Stack direction="row" spacing={1} sx={{ mt: 1, pl: 6.5 }}>
                <Button size="small" variant="contained" color="success"
                  onClick={() => onReview(s, 'approve')} sx={{ textTransform: 'none' }}>Approve</Button>
                <Button size="small" variant="outlined" color="error"
                  onClick={() => onReview(s, 'reject')} sx={{ textTransform: 'none' }}>Reject</Button>
              </Stack>
            )}
            {s.reviewNote && (
              <Typography sx={{ fontSize: 11.5, color: '#6b7280', mt: 0.8, fontStyle: 'italic', pl: 6.5 }}>
                Note: {s.reviewNote}
              </Typography>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}

function ReviewDialog({ state, onClose, onDone }) {
  const { kind, target, action } = state;
  const isApprove = action === 'approve';
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      if (kind === 'adj') await reviewStockAdjustment(target.id, action, note);
      else await reviewSupplier(target.id, action, note);
      onDone(isApprove ? 'Approved' : 'Rejected');
    } catch (e) { setError(e.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isApprove ? 'Approve' : 'Reject'} {kind === 'adj' ? 'adjustment' : 'supplier'}?
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" sx={{ mb: 2 }}>
          {kind === 'adj'
            ? <>Approving will apply stock changes immediately.</>
            : <>Approving will allow this supplier to be used by the counter.</>}
        </Typography>
        <TextField
          label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)}
          multiline minRows={2} fullWidth autoFocus
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          onClick={submit} disabled={submitting} variant="contained"
          color={isApprove ? 'success' : 'error'}
          sx={{ textTransform: 'none' }}
        >
          {submitting ? 'Saving…' : (isApprove ? 'Approve' : 'Reject')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
