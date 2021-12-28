import toastr from 'toastr';

export default function Toastr(type, title, description) {
  const options = {
    positionClass: 'toast-bottom-right',
    closeButton: true,
  };

  toastr[type](description, title, options);
}
