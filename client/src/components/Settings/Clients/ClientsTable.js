import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Trans, withNamespaces } from 'react-i18next';
import ReactTable from 'react-table';

import { MODAL_TYPE } from '../../../helpers/constants';
import { normalizeTextarea } from '../../../helpers/helpers';
import Card from '../../ui/Card';
import Modal from './Modal';
import WrapCell from './WrapCell';

class ClientsTable extends Component {
    handleFormAdd = (values) => {
        this.props.addClient(values);
    };

    handleFormUpdate = (values, name) => {
        this.props.updateClient(values, name);
    };

    handleSubmit = (values) => {
        const config = values;

        if (values) {
            if (values.blocked_services) {
                config.blocked_services = Object
                    .keys(values.blocked_services)
                    .filter(service => values.blocked_services[service]);
            }

            if (values.upstreams && typeof values.upstreams === 'string') {
                config.upstreams = normalizeTextarea(values.upstreams);
            } else {
                config.upstreams = [];
            }
        }

        if (this.props.modalType === MODAL_TYPE.EDIT) {
            this.handleFormUpdate(config, this.props.modalClientName);
        } else {
            this.handleFormAdd(config);
        }
    };

    getClient = (name, clients) => {
        const client = clients.find(item => name === item.name);

        if (client) {
            const { upstreams, whois_info, ...values } = client;
            return {
                upstreams: (upstreams && upstreams.join('\n')) || '',
                ...values,
            };
        }

        return {
            ids: [''],
            use_global_settings: true,
            use_global_blocked_services: true,
        };
    };

    handleDelete = (data) => {
        // eslint-disable-next-line no-alert
        if (window.confirm(this.props.t('client_confirm_delete', { key: data.name }))) {
            this.props.deleteClient(data);
        }
    };

    columns = [
        {
            Header: this.props.t('table_client'),
            accessor: 'ids',
            minWidth: 150,
            Cell: (row) => {
                const { value } = row;

                return (
                    <div className="logs__row logs__row--overflow">
                        <span className="logs__text">
                            {value.map(address => (
                                <div key={address} title={address}>
                                    {address}
                                </div>
                            ))}
                        </span>
                    </div>
                );
            },
        },
        {
            Header: this.props.t('table_name'),
            accessor: 'name',
            minWidth: 120,
            Cell: WrapCell,
        },
        {
            Header: this.props.t('settings'),
            accessor: 'use_global_settings',
            minWidth: 120,
            Cell: ({ value }) => {
                const title = value ? (
                    <Trans>settings_global</Trans>
                ) : (
                    <Trans>settings_custom</Trans>
                );

                return (
                    <div className="logs__row logs__row--overflow">
                        <div className="logs__text">{title}</div>
                    </div>
                );
            },
        },
        {
            Header: this.props.t('blocked_services'),
            accessor: 'blocked_services',
            minWidth: 180,
            Cell: (row) => {
                const { value, original } = row;

                if (original.use_global_blocked_services) {
                    return <Trans>settings_global</Trans>;
                }

                return (
                    <div className="logs__row logs__row--icons">
                        {value && value.length > 0
                            ? value.map(service => (
                                <svg
                                    className="service__icon service__icon--table"
                                    title={service}
                                    key={service}
                                >
                                    <use xlinkHref={`#service_${service}`} />
                                </svg>
                            ))
                            : '–'}
                    </div>
                );
            },
        },
        {
            Header: this.props.t('upstreams'),
            accessor: 'upstreams',
            minWidth: 120,
            Cell: ({ value }) => {
                const title = value && value.length > 0 ? (
                    <Trans>settings_custom</Trans>
                ) : (
                    <Trans>settings_global</Trans>
                );

                return (
                    <div className="logs__row logs__row--overflow">
                        <div className="logs__text">{title}</div>
                    </div>
                );
            },
        },
        {
            Header: this.props.t('requests_count'),
            id: 'statistics',
            accessor: row => this.props.normalizedTopClients[row.name] || 0,
            sortMethod: (a, b) => b - a,
            minWidth: 120,
            Cell: (row) => {
                const { value: clientStats } = row;

                if (clientStats) {
                    return (
                        <div className="logs__row">
                            <div className="logs__text" title={clientStats}>
                                {clientStats}
                            </div>
                        </div>
                    );
                }

                return '–';
            },
        },
        {
            Header: this.props.t('actions_table_header'),
            accessor: 'actions',
            maxWidth: 100,
            Cell: (row) => {
                const clientName = row.original.name;
                const {
                    toggleClientModal, processingDeleting, processingUpdating, t,
                } = this.props;

                return (
                    <div className="logs__row logs__row--center">
                        <button
                            type="button"
                            className="btn btn-icon btn-outline-primary btn-sm mr-2"
                            onClick={() =>
                                toggleClientModal({
                                    type: MODAL_TYPE.EDIT,
                                    name: clientName,
                                })
                            }
                            disabled={processingUpdating}
                            title={t('edit_table_action')}
                        >
                            <svg className="icons">
                                <use xlinkHref="#edit" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="btn btn-icon btn-outline-secondary btn-sm"
                            onClick={() => this.handleDelete({ name: clientName })}
                            disabled={processingDeleting}
                            title={t('delete_table_action')}
                        >
                            <svg className="icons">
                                <use xlinkHref="#delete" />
                            </svg>
                        </button>
                    </div>
                );
            },
        },
    ];

    render() {
        const {
            t,
            clients,
            isModalOpen,
            modalType,
            modalClientName,
            toggleClientModal,
            processingAdding,
            processingUpdating,
        } = this.props;

        const currentClientData = this.getClient(modalClientName, clients);

        return (
            <Card
                title={t('clients_title')}
                subtitle={t('clients_desc')}
                bodyType="card-body box-body--settings"
            >
                <Fragment>
                    <ReactTable
                        data={clients || []}
                        columns={this.columns}
                        defaultSorted={[
                            {
                                id: 'statistics',
                                asc: true,
                            },
                        ]}
                        className="-striped -highlight card-table-overflow"
                        showPagination={true}
                        defaultPageSize={10}
                        minRows={5}
                        previousText={t('previous_btn')}
                        nextText={t('next_btn')}
                        loadingText={t('loading_table_status')}
                        pageText={t('page_table_footer_text')}
                        ofText="/"
                        rowsText={t('rows_table_footer_text')}
                        noDataText={t('clients_not_found')}
                    />
                    <button
                        type="button"
                        className="btn btn-success btn-standard mt-3"
                        onClick={() => toggleClientModal(MODAL_TYPE.ADD)}
                        disabled={processingAdding}
                    >
                        <Trans>client_add</Trans>
                    </button>

                    <Modal
                        isModalOpen={isModalOpen}
                        modalType={modalType}
                        toggleClientModal={toggleClientModal}
                        currentClientData={currentClientData}
                        handleSubmit={this.handleSubmit}
                        processingAdding={processingAdding}
                        processingUpdating={processingUpdating}
                    />
                </Fragment>
            </Card>
        );
    }
}

ClientsTable.propTypes = {
    t: PropTypes.func.isRequired,
    clients: PropTypes.array.isRequired,
    normalizedTopClients: PropTypes.object.isRequired,
    toggleClientModal: PropTypes.func.isRequired,
    deleteClient: PropTypes.func.isRequired,
    addClient: PropTypes.func.isRequired,
    updateClient: PropTypes.func.isRequired,
    isModalOpen: PropTypes.bool.isRequired,
    modalType: PropTypes.string.isRequired,
    modalClientName: PropTypes.string.isRequired,
    processingAdding: PropTypes.bool.isRequired,
    processingDeleting: PropTypes.bool.isRequired,
    processingUpdating: PropTypes.bool.isRequired,
};

export default withNamespaces()(ClientsTable);
